import json
import re
from functools import lru_cache

import google.generativeai as genai
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential

from app.config import settings

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
- "comment" must be specific and actionable — not generic phrases like "improve clarity here".
- Each annotation must reference a DIFFERENT text fragment.
- Focus on the most important problems, not trivial ones.

TEXT TO ANALYZE:
---
{text}
---
"""


@lru_cache
def _get_model() -> genai.GenerativeModel:
    genai.configure(api_key=settings.gemini_api_key)
    return genai.GenerativeModel(
        model_name="gemini-2.5-flash",
        system_instruction=_ANALYSIS_SYSTEM_PROMPT,
    )


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
async def analyze_draft(text: str) -> GeminiAnalysisResult:
    model = _get_model()
    prompt = _ANALYSIS_USER_TEMPLATE.format(text=text)

    try:
        response = await model.generate_content_async(prompt)
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
