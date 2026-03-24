import asyncio
import json
import re
from functools import partial

from google import genai
from google.genai import types
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential

from app.config import settings

_SEGMENT_LABELS: dict[str, str] = {
    "student": "Студент", "junior": "Молодой специалист",
    "founder": "Фаундер / Стартап", "manager": "Руководитель", "other": "Другое",
}
_GOAL_LABELS: dict[str, str] = {
    "interview": "Собеседование", "pitch": "Питч инвестору",
    "conference": "Конференция / Доклад", "defense": "Защита проекта", "other": "Другое",
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
    client = genai.Client(api_key=settings.gemini_api_key)
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
