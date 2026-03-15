"""Gemini prompts and calls for the simulation feature."""
import json
import re

import google.generativeai as genai
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential

from app.config import settings
from app.services.gemini import GeminiError

CONTEXT_WINDOW_MESSAGES = 10  # last N messages sent to Gemini

_PERSONA_DESCRIPTIONS: dict[str, dict] = {
    "investor": {
        "title": "Tough Venture Capitalist",
        "style": "skeptical, data-driven, focused on ROI and market size",
        "focus": "business model, unit economics, market opportunity, team, moat",
    },
    "hr": {
        "title": "Senior HR Manager",
        "style": "empathetic but probing, focused on cultural fit and soft skills",
        "focus": "motivation, conflict resolution, leadership, teamwork, growth mindset",
    },
    "tech_lead": {
        "title": "Principal Engineer / Tech Lead",
        "style": "precise, technical, unimpressed by buzzwords",
        "focus": "architecture decisions, scalability, tradeoffs, technical depth",
    },
    "listener": {
        "title": "Curious General Audience Member",
        "style": "friendly but genuinely confused, asks 'why' and 'how' questions",
        "focus": "clarity, jargon-free explanation, real-world impact",
    },
}

_SIMULATION_SYSTEM_TEMPLATE = """
You are playing the role of {persona_title} in a Q&A session after a presentation.
Your style: {persona_style}
Focus areas: {persona_focus}
Industry context: {industry}
Difficulty level: {difficulty}/5 ({difficulty_desc})

RULES:
- Ask ONE challenging question per turn
- Stay fully in character — do not break the persona
- Your difficulty is {difficulty}/5: {difficulty_desc}
- Always respond in the SAME LANGUAGE as the presentation text
- Return ONLY valid JSON — no markdown, no extra text

JSON structure:
{{
  "internal_reasoning": "<your private strategy: what weakness to probe, what angle to take>",
  "question": "<your actual question to the presenter>",
  "difficulty_level": <integer 1-5 reflecting this specific question's difficulty>
}}
""".strip()

_SKILL_EVAL_TEMPLATE = """
You are an expert communication coach. Evaluate the presenter's performance in this Q&A session.

PRESENTATION CONTEXT:
{doc_text}

SESSION TRANSCRIPT:
{transcript}

Rate EACH of the following skills on a scale from 0.0 to 1.0 and provide a specific comment.
Return ONLY valid JSON:
{{
  "clarity": {{"score": <0.0-1.0>, "comment": "<specific observation>"}},
  "argumentation": {{"score": <0.0-1.0>, "comment": "<specific observation>"}},
  "stress_resistance": {{"score": <0.0-1.0>, "comment": "<specific observation>"}},
  "structure": {{"score": <0.0-1.0>, "comment": "<specific observation>"}},
  "conciseness": {{"score": <0.0-1.0>, "comment": "<specific observation>"}}
}}
""".strip()

_DIFFICULTY_DESCRIPTIONS = {
    1: "very gentle, almost no pushback",
    2: "mild, polite questions",
    3: "standard professional rigor",
    4: "aggressive, stress-testing",
    5: "brutal, adversarial, relentless",
}


def _parse_json(raw: str) -> dict:
    cleaned = re.sub(r"```(?:json)?\s*", "", raw).strip().rstrip("```").strip()
    return json.loads(cleaned)


class SimulationTurn:
    def __init__(self, internal_reasoning: str, question: str, difficulty_level: int) -> None:
        self.internal_reasoning = internal_reasoning
        self.question = question
        self.difficulty_level = difficulty_level


class SkillEvaluation:
    def __init__(self, metrics: list[dict]) -> None:
        self.metrics = metrics


def _build_system_prompt(persona_config: dict) -> str:
    role = persona_config.get("role", "listener")
    persona = _PERSONA_DESCRIPTIONS.get(role, _PERSONA_DESCRIPTIONS["listener"])
    difficulty = int(persona_config.get("difficulty", 3))
    return _SIMULATION_SYSTEM_TEMPLATE.format(
        persona_title=persona["title"],
        persona_style=persona["style"],
        persona_focus=persona["focus"],
        industry=persona_config.get("industry", "general"),
        difficulty=difficulty,
        difficulty_desc=_DIFFICULTY_DESCRIPTIONS.get(difficulty, "standard"),
    )


def _build_user_prompt(doc_text: str, history: list[dict]) -> str:
    history_text = ""
    if history:
        lines = []
        for msg in history[-CONTEXT_WINDOW_MESSAGES:]:
            role_label = "PRESENTER" if msg["role"] == "user" else "YOU (interviewer)"
            lines.append(f"{role_label}: {msg['content']}")
        history_text = "\n".join(lines)

    parts = []
    if doc_text:
        parts.append(f"PRESENTATION CONTENT:\n---\n{doc_text[:8000]}\n---")
    if history_text:
        parts.append(f"CONVERSATION SO FAR:\n{history_text}")

    if not history:
        if doc_text:
            parts.append("START the session by asking your first question based on the presentation.")
        else:
            parts.append("No document provided. START the session by asking a broad opening question relevant to your role and focus areas.")
    else:
        parts.append("Ask your NEXT question. Build on the conversation — probe deeper or shift focus.")

    return "\n\n".join(parts)


def _make_simulation_model(persona_config: dict) -> genai.GenerativeModel:
    """Create a Gemini model instance with persona-specific system prompt."""
    genai.configure(api_key=settings.gemini_api_key)
    return genai.GenerativeModel(
        model_name="gemini-2.5-flash",
        system_instruction=_build_system_prompt(persona_config),
    )


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    retry=retry_if_exception_type((GeminiError, json.JSONDecodeError)),
    reraise=True,
)
async def generate_question(
    persona_config: dict,
    doc_text: str,
    history: list[dict],
) -> SimulationTurn:
    model = _make_simulation_model(persona_config)
    prompt = _build_user_prompt(doc_text, history)

    try:
        response = await model.generate_content_async(prompt)
    except Exception as exc:
        raise GeminiError(f"Gemini simulation call failed: {exc}") from exc

    raw = response.text
    if not raw:
        raise GeminiError("Empty response from Gemini")

    parsed = _parse_json(raw)
    return SimulationTurn(
        internal_reasoning=parsed.get("internal_reasoning", ""),
        question=parsed.get("question", ""),
        difficulty_level=max(1, min(5, int(parsed.get("difficulty_level", 3)))),
    )


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    retry=retry_if_exception_type((GeminiError, json.JSONDecodeError)),
    reraise=True,
)
async def evaluate_session(doc_text: str, messages: list[dict]) -> SkillEvaluation:
    transcript_lines = []
    for msg in messages:
        label = "PRESENTER" if msg["role"] == "user" else "INTERVIEWER"
        transcript_lines.append(f"{label}: {msg['content']}")
    transcript = "\n".join(transcript_lines)

    prompt = _SKILL_EVAL_TEMPLATE.format(
        doc_text=doc_text[:4000] if doc_text else "No document provided.",
        transcript=transcript,
    )

    genai.configure(api_key=settings.gemini_api_key)
    model = genai.GenerativeModel(model_name="gemini-2.5-flash")
    try:
        response = await model.generate_content_async(prompt)
    except Exception as exc:
        raise GeminiError(f"Gemini evaluation call failed: {exc}") from exc

    parsed = _parse_json(response.text or "")

    metrics = []
    for name, data in parsed.items():
        score = float(data.get("score", 0.5))
        metrics.append({
            "name": name,
            "score": max(0.0, min(1.0, score)),
            "comment": data.get("comment", ""),
        })

    return SkillEvaluation(metrics=metrics)
