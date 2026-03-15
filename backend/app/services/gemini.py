import json
import re
from functools import lru_cache

import google.generativeai as genai
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential

from app.config import settings

_ANALYSIS_SYSTEM_PROMPT = """
You are an expert speech coach and communication trainer specializing in business Russian.
Your task is to analyze a speech, presentation, or document text and provide:
1. Detailed feedback on specific aspects
2. An improved version of the text

Always respond in the SAME LANGUAGE as the input text.
Return ONLY valid JSON — no markdown, no backticks, no extra text.
""".strip()

_ANALYSIS_USER_TEMPLATE = """
Analyze the following text and return JSON with this exact structure:
{{
  "improved_text": "<rewritten version — better structure, clarity, no fluff>",
  "feedback": {{
    "logic": "<assessment of logical flow and argument structure>",
    "style": "<assessment of style, tone, and professionalism>",
    "clarity": "<assessment of clarity, conciseness, and impact>",
    "grammar": "<assessment of grammar, punctuation, and language correctness>",
    "overall_score": <integer 1-10>
  }}
}}

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
    # Strip markdown code blocks if present
    cleaned = re.sub(r"```(?:json)?\s*", "", raw).strip().rstrip("```").strip()
    return json.loads(cleaned)


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    retry=retry_if_exception_type((GeminiError, json.JSONDecodeError)),
    reraise=True,
)
def analyze_draft(text: str) -> GeminiAnalysisResult:
    model = _get_model()
    prompt = _ANALYSIS_USER_TEMPLATE.format(text=text)

    try:
        response = model.generate_content(prompt)
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

    # Validate required feedback keys
    required_keys = {"logic", "style", "clarity", "grammar", "overall_score"}
    if not required_keys.issubset(feedback.keys()):
        raise GeminiError(f"Missing feedback keys: {required_keys - feedback.keys()}")

    score = feedback.get("overall_score", 0)
    if not isinstance(score, int) or not (1 <= score <= 10):
        feedback["overall_score"] = max(1, min(10, int(score)))

    return GeminiAnalysisResult(improved_text=improved_text, feedback=feedback)
