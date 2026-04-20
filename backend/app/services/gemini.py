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
Ты — экспертный speech coach и тренер по коммуникации, специализирующийся на русскоязычной деловой речи.
Твоя задача — проанализировать речь, презентацию или документ и дать структурированную обратную связь с аннотациями на уровне фрагментов.

Всегда отвечай НА ТОМ ЖЕ ЯЗЫКЕ, что и входной текст.
Верни ТОЛЬКО валидный JSON: без markdown, без обратных кавычек, без любого текста вне JSON-объекта.
""".strip()

_ANALYSIS_USER_TEMPLATE = """
Проанализируй следующий текст и верни JSON ровно с такой структурой:
{{
  "improved_text": "<переписанная версия текста>",
  "feedback": {{
    "logic": "<оценка логики и структуры аргументации — 2-3 предложения>",
    "style": "<оценка стиля, тона и профессиональности — 2-3 предложения>",
    "clarity": "<оценка ясности, лаконичности и убедительности — 2-3 предложения>",
    "grammar": "<оценка грамматики, пунктуации и языковой корректности — 2-3 предложения>",
    "overall_score": <integer 1-10>,
    "annotations": [
      {{
        "text": "<ТОЧНАЯ дословная подстрока из исходного текста ниже, максимум 200 символов>",
        "issue_type": "<logic|style|clarity|grammar>",
        "comment": "<конкретная, применимая рекомендация именно для этого фрагмента>",
        "severity": "<high|medium|low>"
      }}
    ]
  }}
}}

СТРОГИЕ ПРАВИЛА ДЛЯ improved_text:
- Пиши ТОЛЬКО обычными абзацами прозы.
- АБСОЛЮТНО НИКАКОГО markdown: без **, без *, без #, без -, без нумерованных списков, без заголовков, без bold, без italic.
- Не используй буллеты и никакое оформление списков.
- Сохрани исходный жанр: если это была речь — верни речь; если отчёт — верни отчёт.
- Используй естественный, человеческий язык. Избегай безликих корпоративных формулировок в стиле AI.
- Сохрани голос и тон автора — улучши только структуру, аргументацию и ясность.

СТРОГИЕ ПРАВИЛА ДЛЯ annotations:
- Добавь от 4 до 8 аннотаций, покрывающих самые важные проблемы.
- Поле "text" ОБЯЗАНО быть точной дословной подстрокой из исходного текста. Не перефразируй.
- Поле "comment" ОБЯЗАНО включать конкретный пример переписывания до/после. Формат: сначала 1 предложение с объяснением проблемы, затем: "Например: «[исходный фрагмент]» → «[улучшенная версия]»". Никогда не пиши общий совет вроде "улучши ясность" или "перепиши предложение" без явного варианта переписывания.
- Каждая аннотация должна ссылаться на ДРУГОЙ фрагмент текста.
- Фокусируйся на самых важных проблемах, а не на мелочах.

ТЕКСТ ДЛЯ АНАЛИЗА:
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
            context_block = (
                f"ПРОФИЛЬ СПИКЕРА:\n- Роль: {seg}\n- Цель: {goal}\n"
                "Подстрой тон обратной связи, примеры и рекомендации под бэкграунд и задачу этого человека.\n\n"
            )
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


_AI_DETECTION_SYSTEM = """Ты — детектор AI-контента. Определи, написан ли текст человеком или сгенерирован ИИ.

Смотри на следующие сигналы:
1. СТРУКТУРА — неестественный markdown, нумерованные списки в устном ответе
2. СТИЛЬ — формальные AI-паттерны: "безусловно", "следует отметить", "certainly", "in conclusion"
3. СОДЕРЖАНИЕ — пустой, общий текст без личных деталей и конкретных чисел
4. ЕСТЕСТВЕННОСТЬ — звучит ли это как реальный устный ответ с нормальными человеческими шероховатостями?

Смещай решение к FALSE: если не уверен, отвечай false. Отвечай true только когда текст явно сгенерирован ИИ.
Верни ТОЛЬКО: {"ai_generated": true} или {"ai_generated": false}"""


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
    prompt = (
        f"Этот ответ сгенерирован ИИ?\n---\n{text[:2000]}\n---\n"
        "JSON: {\"ai_generated\": true} или {\"ai_generated\": false}"
    )

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
