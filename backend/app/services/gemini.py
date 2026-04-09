import asyncio
import json
import re
from functools import partial

from google import genai
from google.genai import types
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential

from app.config import settings

_SEGMENT_LABELS: dict[str, str] = {
    "manager": "Тимлид / Менеджер",
    "head": "Руководитель функции",
    "founder": "Фаундер / CEO",
    "customer_facing": "Клиентская команда",
    "other": "Другое",
}
_GOAL_LABELS: dict[str, str] = {
    "budget_defense": "Защита бюджета / roadmap",
    "pitch": "Инвест-спич / продажа",
    "qbr": "QBR / клиентский review",
    "stakeholder": "Сложный разговор со стейкхолдером",
    "other": "Другое",
}

_ANALYSIS_SYSTEM_PROMPT = """
You are an expert speech coach and communication trainer specializing in Russian business communication.
Your task is to analyze a speech, presentation, or document and provide structured feedback with fragment-level annotations.

Always respond in the SAME LANGUAGE as the input text.
Return ONLY valid JSON — no markdown, no backticks, no extra text outside the JSON object.
""".strip()

_ANALYSIS_USER_TEMPLATE = """
Analyze the following text and return JSON with this exact structure:
{{
  "improved_text": "<rewritten version of the text>",
  "feedback": {{
    "logic": "<assessment of logical flow and argument structure — 2-3 sentences>",
    "style": "<assessment of style, tone, and professionalism — 2-3 sentences>",
    "clarity": "<assessment of clarity, conciseness, and impact — 2-3 sentences>",
    "grammar": "<assessment of grammar, punctuation, and language correctness — 2-3 sentences>",
    "overall_score": <integer 1-10>,
    "annotations": [
      {{
        "text": "<EXACT verbatim substring from the original text below, max 200 chars>",
        "issue_type": "<logic|style|clarity|grammar>",
        "comment": "<specific, actionable recommendation for this exact fragment>",
        "severity": "<high|medium|low>"
      }}
    ]
  }}
}}

STRICT RULES FOR improved_text:
- Write in plain prose paragraphs ONLY.
- ABSOLUTELY NO markdown: no **, no *, no #, no -, no numbered lists, no headers, no bold, no italic.
- Do NOT use bullet points or any list formatting.
- Preserve the original genre: if it was a speech — write a speech; if a report — write a report.
- Use natural, human language. Avoid generic AI-sounding corporate phrases.
- Keep the author's voice and tone — just improve structure, argumentation, and clarity.

STRICT RULES FOR annotations:
- Include 4 to 8 annotations covering the most impactful issues.
- The "text" field MUST be an exact verbatim substring copied from the original text. Do not paraphrase.
- "comment" MUST include a concrete before/after rewrite example. Format: first explain the problem in 1 sentence, then provide: "Например: «[original fragment]» → «[improved version]»". Never write generic advice like "improve clarity here" or "rewrite this sentence" without showing the actual rewrite.
- Each annotation must reference a DIFFERENT text fragment.
- Focus on the most important problems, not trivial ones.

TEXT TO ANALYZE:
---
{text}
---
"""


class GeminiError(Exception):
    pass


class GeminiAnalysisResult:
    def __init__(self, improved_text: str, feedback: dict) -> None:
        self.improved_text = improved_text
        self.feedback = feedback


def _build_http_options() -> types.HttpOptions | None:
    proxy_url = settings.gemini_proxy_url.strip()
    if not proxy_url:
        return None

    return types.HttpOptions(
        client_args={"proxy": proxy_url, "trust_env": False},
        async_client_args={"proxy": proxy_url, "trust_env": False},
    )


def create_gemini_client() -> genai.Client:
    http_options = _build_http_options()
    if http_options is None:
        return genai.Client(api_key=settings.gemini_api_key)
    return genai.Client(api_key=settings.gemini_api_key, http_options=http_options)


def _parse_gemini_json(raw: str) -> dict:
    """Extract JSON from Gemini response, stripping any accidental markdown."""
    cleaned = re.sub(r"```(?:json)?\s*", "", raw).strip().rstrip("```").strip()
    return json.loads(cleaned)


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    retry=retry_if_exception_type((GeminiError, json.JSONDecodeError)),
    reraise=True,
)
async def analyze_draft(text: str, user_context: dict | None = None) -> GeminiAnalysisResult:
    client = create_gemini_client()
    context_block = ""
    if user_context:
        seg = _SEGMENT_LABELS.get(user_context.get("segment", ""), "")
        goal = _GOAL_LABELS.get(user_context.get("goal", ""), "")
        if seg or goal:
            context_block = f"SPEAKER PROFILE:\n- Role: {seg}\n- Goal: {goal}\nTailor feedback tone, examples, and recommendations to this person's background and objective.\n\n"
    prompt = context_block + _ANALYSIS_USER_TEMPLATE.format(text=text)

    try:
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            None,
            partial(
                client.models.generate_content,
                model="gemini-2.5-flash-lite",
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=_ANALYSIS_SYSTEM_PROMPT,
                ),
            ),
        )
    except Exception as exc:
        raise GeminiError(f"Gemini API call failed: {exc}") from exc

    raw = response.text
    if not raw:
        raise GeminiError("Gemini returned empty response")

    parsed = _parse_gemini_json(raw)

    improved_text = parsed.get("improved_text", "")
    feedback = parsed.get("feedback", {})

    if not improved_text or not isinstance(feedback, dict):
        raise GeminiError(f"Unexpected Gemini response structure: {parsed}")

    required_keys = {"logic", "style", "clarity", "grammar", "overall_score"}
    if not required_keys.issubset(feedback.keys()):
        raise GeminiError(f"Missing feedback keys: {required_keys - feedback.keys()}")

    score = feedback.get("overall_score", 0)
    if not isinstance(score, int) or not (1 <= score <= 10):
        feedback["overall_score"] = max(1, min(10, int(score)))

    return GeminiAnalysisResult(improved_text=improved_text, feedback=feedback)


# ─── Smart hybrid AI detector ────────────────────────────────────────────────
# Strategy: fast heuristic gate (no tokens) + Gemini arbiter (only when unsure)

# Phrases strongly associated with AI-generated Russian text
_AI_TRIGGER_PHRASES = [
    # Russian AI-speak
    "в заключение",
    "следует отметить",
    "ключевые аспекты",
    "важно понимать",
    "данный вопрос",
    "безусловно",
    "необходимо отметить",
    "во-первых",
    "во-вторых",
    "в-третьих",
    "таким образом",
    # English AI-speak (if answer is in English)
    "certainly",
    "of course",
    "it is important to note",
    "in conclusion",
    "firstly",
    "secondly",
    "thirdly",
    "key aspects",
    "in summary",
    "to summarize",
]

# Lists/headers are very strong AI signal
_LIST_PATTERN = re.compile(r"^\s*([\-\*]|\d+[\.\)]|[a-zA-Z][\.\)])\s+", re.MULTILINE)
_HEADER_PATTERN = re.compile(r"^\s*#+\s+", re.MULTILINE)
_BOLD_PATTERN = re.compile(r"\*{1,2}[^*]+\*{1,2}")


def _heuristic_score(text: str) -> float:
    """
    Returns a score 0.0–1.0 representing "how likely this is AI-generated".
    0.0 = clearly human, 1.0 = almost certainly AI.
    """
    text_lower = text.lower()
    # Minimum meaningful length
    if len(text) < 60:
        return 0.0  # Too short — skip

    score = 0.0
    signals = 0

    # 1. Markdown-style formatting (super strong signal: +0.5 each, max 1.0)
    if _LIST_PATTERN.search(text):
        score += 0.5
        signals += 1
    if _HEADER_PATTERN.search(text) or _BOLD_PATTERN.search(text):
        score += 0.35
        signals += 1

    # 2. AI trigger phrases (+0.2 each, capped at 0.6)
    phrase_hits = sum(1 for p in _AI_TRIGGER_PHRASES if p in text_lower)
    phrase_contribution = min(phrase_hits * 0.2, 0.6)
    if phrase_hits > 0:
        score += phrase_contribution
        signals += 1

    # 3. Paragraphs of eerily equal length (+0.2 if very uniform)
    paragraphs = [p.strip() for p in text.split("\n\n") if len(p.strip()) > 80]
    if len(paragraphs) >= 3:
        lengths = [len(p) for p in paragraphs]
        avg = sum(lengths) / len(lengths)
        deviation = sum(abs(l - avg) for l in lengths) / len(lengths)
        if avg > 0 and deviation / avg < 0.25:  # Very uniform paragraphs
            score += 0.2
            signals += 1

    # 4. Zero typos / colloquialisms in long text — hard to detect directly,
    #    so we check for absence of any common informal Russian markers
    informal_markers = ["ну", "вот", "вообще", "такой", "как-то", "почти", "просто", "...", "!", "?", 
                          "in", "it", "yeah", "yep", "итак", "подожди"]
    if len(text) > 300 and not any(m in text_lower for m in informal_markers):
        score += 0.15
        signals += 1

    # 5. Suspiciously balanced structure: intro + 3 equal points + conclusion
    sentences = [s.strip() for s in re.split(r"[.!?]", text) if len(s.strip()) > 20]
    if len(sentences) > 5:
        s_lengths = [len(s) for s in sentences]
        s_avg = sum(s_lengths) / len(s_lengths)
        s_dev = sum(abs(l - s_avg) for l in s_lengths) / len(s_lengths)
        if s_avg > 0 and s_dev / s_avg < 0.3:
            score += 0.15
            signals += 1

    return min(score, 1.0), signals


_AI_DETECTION_SYSTEM = """You are an AI-content detector. Decide if the text was written by a human or generated by AI.

Focus on these signals:
1. STRUCTURE — unnatural markdown, numbered lists in a spoken answer
2. STYLE — formal AI-speak patterns: "безусловно", "следует отметить", "certainly", "in conclusion"
3. CONTENT — hollow, generic, no personal anecdotes or concrete numbers
4. NATURALNESS — does it sound like a real spoken answer with natural imperfections?

Bias toward FALSE: if you're unsure, answer false. Only answer true when the text is unmistakably AI.
Return ONLY: {"ai_generated": true} or {"ai_generated": false}"""


async def detect_ai_content(text: str) -> bool:
    """
    Hybrid AI detection:
    1. Fast local heuristic scorer (no API tokens spent).
       - score >= 0.75 → immediately flag as AI (high confidence)
       - score <= 0.25 → immediately pass as human
       - 0.25 < score < 0.75 → uncertain zone → escalate to Gemini
    2. Gemini arbiter (only called in uncertain zone, cheap flash-lite call with max_output_tokens=10)

    Fails open: returns False on any error — never blocks legitimate users.
    """
    if len(text.strip()) < 60:
        return False  # Too short to reliably detect

    score, signals = _heuristic_score(text)

    # Fast path: high confidence (no API call)
    if score >= 0.75:
        return True
    if score <= 0.25:
        return False

    # Uncertain zone (0.25 < score < 0.75): ask Gemini as arbiter
    client = create_gemini_client()
    prompt = f"Is this answer AI-generated?\n---\n{text[:2000]}\n---\nJSON: {{\"ai_generated\": true}} or {{\"ai_generated\": false}}"

    try:
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            None,
            partial(
                client.models.generate_content,
                model="gemini-2.5-flash-lite",
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=_AI_DETECTION_SYSTEM,
                    max_output_tokens=10,
                    temperature=0.1,  # Low temp = more deterministic
                ),
            ),
        )
        raw = response.text or ""
        parsed = _parse_gemini_json(raw)
        return bool(parsed.get("ai_generated", False))
    except Exception:
        # Fail open: if Gemini fails, trust the heuristic score direction
        return score >= 0.55  # In uncertain zone, lean on heuristics
