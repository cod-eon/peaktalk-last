import asyncio
import json
import logging
import re
from collections.abc import Sequence
from functools import lru_cache, partial
from typing import Any

from openai import OpenAI
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential

from app.config import settings

logger = logging.getLogger("peaktalk.ai")

_SEGMENT_LABELS: dict[str, str] = {
    "manager": "Тимлид / Менеджер",
    "head": "Руководитель функции",
    "founder": "Фаундер / CEO",
    "customer_facing": "Клиентская команда",
    "other": "Другое",
}
_GOAL_LABELS: dict[str, str] = {
    "budget_defense": "Защита бюджета / roadmap",
    "pitch": "Инвест-питч / продажа",
    "qbr": "QBR / клиентский review",
    "stakeholder": "Сложный разговор со стейкхолдером",
    "other": "Другое",
}

_ANALYSIS_SYSTEM_PROMPT = """
Ты — эксперт по стресс-тесту аргументации перед сложными рабочими встречами.
Твоя задача — проанализировать материал встречи, презентацию или документ и дать структурированную обратную связь с аннотациями на уровне фрагментов.

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


class CloudRuAIError(Exception):
    pass


class CloudRuAnalysisResult:
    def __init__(self, improved_text: str, feedback: dict) -> None:
        self.improved_text = improved_text
        self.feedback = feedback


@lru_cache(maxsize=1)
def _build_openai_client(api_key: str, base_url: str, timeout: float) -> OpenAI:
    return OpenAI(api_key=api_key, base_url=base_url, timeout=timeout)


def create_cloud_ru_client() -> OpenAI:
    api_key = settings.cloud_ru_api_key.strip()
    if not api_key:
        raise CloudRuAIError("Cloud.ru API key is not configured. Set CLOUD_RU_API_KEY.")
    return _build_openai_client(
        api_key=api_key,
        base_url=settings.cloud_ru_base_url,
        timeout=settings.cloud_ru_timeout_seconds,
    )


def extract_completion_text(response: Any) -> str:
    if not getattr(response, "choices", None):
        return ""

    content = response.choices[0].message.content
    if isinstance(content, str):
        return content.strip()

    if isinstance(content, Sequence):
        parts: list[str] = []
        for item in content:
            if isinstance(item, str):
                parts.append(item)
                continue
            if isinstance(item, dict):
                text = item.get("text")
                if isinstance(text, str):
                    parts.append(text)
                continue
            text = getattr(item, "text", None)
            if isinstance(text, str):
                parts.append(text)
        return "".join(parts).strip()

    text = getattr(content, "text", None)
    if isinstance(text, str):
        return text.strip()
    return ""


def _parse_cloud_ru_json(raw: str) -> dict:
    """Extract JSON from Cloud.ru response, stripping any accidental markdown."""
    cleaned = re.sub(r"```(?:json)?\s*", "", raw).strip().rstrip("```").strip()
    if not cleaned.startswith("{"):
        start = cleaned.find("{")
        end = cleaned.rfind("}")
        if start != -1 and end != -1 and end > start:
            cleaned = cleaned[start : end + 1]
    return json.loads(cleaned)


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    retry=retry_if_exception_type((CloudRuAIError, json.JSONDecodeError)),
    reraise=True,
)
async def analyze_draft(text: str, user_context: dict | None = None) -> CloudRuAnalysisResult:
    client = create_cloud_ru_client()
    context_block = ""
    if user_context:
        seg = _SEGMENT_LABELS.get(user_context.get("segment", ""), "")
        goal = _GOAL_LABELS.get(user_context.get("goal", ""), "")
        if seg or goal:
            context_block = (
                f"ПРОФИЛЬ УЧАСТНИКА:\n- Роль: {seg}\n- Цель: {goal}\n"
                "Подстрой тон обратной связи, примеры и рекомендации под бэкграунд и задачу этого человека.\n\n"
            )
    prompt = context_block + _ANALYSIS_USER_TEMPLATE.format(text=text)

    try:
        loop = asyncio.get_running_loop()
        started = loop.time()
        response = await loop.run_in_executor(
            None,
            partial(
                client.chat.completions.create,
                model=settings.cloud_ru_model,
                messages=[
                    {"role": "system", "content": _ANALYSIS_SYSTEM_PROMPT},
                    {"role": "user", "content": prompt},
                ],
                temperature=0.2,
                top_p=0.9,
                presence_penalty=0,
                frequency_penalty=0,
                max_completion_tokens=3200,
            ),
        )
        logger.info(
            "ai.analyze_draft model=%s chars=%d elapsed_ms=%.1f",
            settings.cloud_ru_model,
            len(text),
            (loop.time() - started) * 1000,
        )
    except Exception as exc:
        raise CloudRuAIError(f"Cloud.ru API call failed: {exc}") from exc

    raw = extract_completion_text(response)
    if not raw:
        raise CloudRuAIError("Cloud.ru returned empty response")

    try:
        parsed = _parse_cloud_ru_json(raw)
    except json.JSONDecodeError as exc:
        logger.warning("ai.analyze_draft invalid_json raw_prefix=%r", raw[:200])
        raise CloudRuAIError("Cloud.ru returned invalid JSON") from exc

    improved_text = parsed.get("improved_text", "")
    feedback = parsed.get("feedback", {})

    if not improved_text or not isinstance(feedback, dict):
        raise CloudRuAIError(f"Unexpected Cloud.ru response structure: {parsed}")

    required_keys = {"logic", "style", "clarity", "grammar", "overall_score"}
    if not required_keys.issubset(feedback.keys()):
        raise CloudRuAIError(f"Missing feedback keys: {required_keys - feedback.keys()}")

    score = feedback.get("overall_score", 0)
    if not isinstance(score, int) or not (1 <= score <= 10):
        feedback["overall_score"] = max(1, min(10, int(score)))

    return CloudRuAnalysisResult(improved_text=improved_text, feedback=feedback)


# ─── Smart hybrid AI detector ────────────────────────────────────────────────
# Strategy: fast heuristic gate (no tokens) + Cloud.ru arbiter (only when unsure)

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
       - 0.25 < score < 0.75 → uncertain zone → escalate to Cloud.ru
    2. Cloud.ru arbiter (only called in uncertain zone, cheap short call with max_output_tokens=10)

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

    if not settings.ai_detection_llm_enabled:
        return score >= 0.65

    # Uncertain zone (0.25 < score < 0.75): ask Cloud.ru as arbiter
    client = create_cloud_ru_client()
    prompt = (
        f"Этот ответ сгенерирован ИИ?\n---\n{text[:2000]}\n---\n"
        "JSON: {\"ai_generated\": true} или {\"ai_generated\": false}"
    )

    try:
        loop = asyncio.get_event_loop()
        started = loop.time()
        response = await loop.run_in_executor(
            None,
            partial(
                client.chat.completions.create,
                model=settings.cloud_ru_model,
                messages=[
                    {"role": "system", "content": _AI_DETECTION_SYSTEM},
                    {"role": "user", "content": prompt},
                ],
                temperature=0.1,
                top_p=0.9,
                max_completion_tokens=32,
            ),
        )
        logger.info(
            "ai.detect_content llm_arbiter model=%s chars=%d elapsed_ms=%.1f",
            settings.cloud_ru_model,
            len(text),
            (loop.time() - started) * 1000,
        )
        raw = extract_completion_text(response)
        parsed = _parse_cloud_ru_json(raw)
        return bool(parsed.get("ai_generated", False))
    except Exception:
        # Fail open: if Cloud.ru fails, trust the heuristic score direction
        return score >= 0.55  # In uncertain zone, lean on heuristics
