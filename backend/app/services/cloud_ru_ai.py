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
Твоя задача — превратить материал встречи, презентацию или документ в pressure scan:
найти слабые места позиции, показать будущие возражения и подготовить defense-ready версию материала.

Всегда отвечай НА ТОМ ЖЕ ЯЗЫКЕ, что и входной текст.
Верни ТОЛЬКО валидный JSON: без markdown, без обратных кавычек, без любого текста вне JSON-объекта.
""".strip()

_ANALYSIS_USER_TEMPLATE = """
Проанализируй следующий материал для реальной рабочей встречи и верни JSON ровно с такой структурой:
{{
  "improved_text": "<усиленная defense-ready версия материала>",
  "feedback": {{
    "logic": "<pressure scan логики позиции: доказательства, метрики, trade-off, владелец решения — 2-3 предложения>",
    "style": "<оценка тона под давлением будущего оппонента: уверенность без общих фраз и защиты ради защиты — 2-3 предложения>",
    "clarity": "<оценка ясности ask, решения, next step и того, что должен понять руководитель/клиент/инвестор — 2-3 предложения>",
    "grammar": "<оценка языковой точности только там, где формулировки снижают доверие или создают двусмысленность — 1-2 предложения>",
    "overall_score": <integer 1-10>,
    "annotations": [
      {{
        "text": "<ТОЧНАЯ дословная подстрока из исходного текста ниже, максимум 200 символов>",
        "issue_type": "<logic|style|clarity|grammar>",
        "comment": "<почему этот фрагмент не выдержит давления и как его усилить>",
        "severity": "<high|medium|low>"
      }}
    ],
    "defense_brief": {{
      "evidence_gaps": [
        "<1-3 слабых доказательства, недостающие цифры, рискованные допущения или отсутствующие владельцы решения>"
      ],
      "pressure_questions": [
        "<1-3 вопроса/возражения, которые вероятно задаст CEO/CFO/клиент/инвестор/стейкхолдер>"
      ],
      "next_moves": [
        "<1-3 конкретных действия, которые нужно сделать с материалом до реальной встречи>"
      ]
    }}
  }}
}}

СТРОГИЕ ПРАВИЛА ДЛЯ improved_text:
- Это НЕ мотивационная речь, НЕ курс публичных выступлений и НЕ красивое переписывание ради стиля.
- Собери defense-ready версию материала: позиция/ask, доказательства, цена компромисса, ожидаемое возражение и следующий шаг.
- Пиши ТОЛЬКО обычными абзацами прозы.
- АБСОЛЮТНО НИКАКОГО markdown: без **, без *, без #, без -, без нумерованных списков, без заголовков, без bold, без italic.
- Не используй буллеты и никакое оформление списков.
- Сохрани исходный жанр и рабочий контекст: если это memo — верни усиленный memo; если КП — верни усиленное КП; если тезисы защиты — верни усиленные тезисы в прозе.
- Используй естественный, человеческий язык. Избегай безликих корпоративных формулировок в стиле AI.
- Сохрани голос автора, но сделай позицию пригодной для защиты перед CFO, CEO, клиентом, инвестором или другим жестким стейкхолдером.
- Не выдумывай факты, цифры, клиентов, гарантии или обещания. Если доказательства не хватает, честно обозначь это как место, которое нужно заполнить.

СТРОГИЕ ПРАВИЛА ДЛЯ annotations:
- Добавь от 4 до 8 аннотаций, покрывающих самые важные проблемы.
- Поле "text" ОБЯЗАНО быть точной дословной подстрокой из исходного текста. Не перефразируй.
- Поле "comment" ОБЯЗАНО объяснять, какой вопрос/возражение возникнет у оппонента, и включать конкретное усиление до/после. Формат: сначала 1 предложение с pressure-рискoм, затем: "Например: «[исходный фрагмент]» → «[усиленная версия]»". Никогда не пиши общий совет вроде "улучши ясность" или "перепиши предложение" без явного варианта усиления.
- Каждая аннотация должна ссылаться на ДРУГОЙ фрагмент текста.
- Фокусируйся на самых важных проблемах, а не на мелочах.
- Для issue_type используй:
  - "logic" — нет доказательства, метрики, причинно-следственной связи, trade-off, владельца решения или цены риска.
  - "clarity" — неясен ask, адресат, следующий шаг, решение или критерий успеха.
  - "style" — тон звучит оборонительно, общо, слишком мягко или не выдерживает executive/customer pressure.
  - "grammar" — языковая ошибка, двусмысленность или терминологическая неточность снижает доверие.

СТРОГИЕ ПРАВИЛА ДЛЯ defense_brief:
- Это практический артефакт перед встречей, а не пересказ анализа.
- evidence_gaps: только конкретные дыры в доказательствах, цифрах, рисках, assumptions, owner или критерии успеха.
- pressure_questions: формулируй как реальные неудобные вопросы оппонента, не как советы автору.
- next_moves: формулируй как действия перед встречей: какую цифру добавить, какой trade-off зафиксировать, какой ask уточнить.
- Не добавляй больше 3 пунктов в каждый массив.
- Не выдумывай факты; если данных нет, укажи, какую именно недостающую информацию нужно заполнить.

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


def _clean_string_list(value: Any, *, limit: int = 3) -> list[str]:
    if not isinstance(value, list):
        return []
    cleaned: list[str] = []
    seen: set[str] = set()
    for item in value:
        if not isinstance(item, str):
            continue
        normalized = re.sub(r"\s+", " ", item).strip()
        if not normalized:
            continue
        key = normalized.lower()
        if key in seen:
            continue
        seen.add(key)
        cleaned.append(normalized[:260])
        if len(cleaned) >= limit:
            break
    return cleaned


def _first_sentence(value: Any) -> str:
    if not isinstance(value, str):
        return ""
    text = re.split(r"Например:", value, maxsplit=1, flags=re.IGNORECASE)[0].strip()
    match = re.match(r"^(.{1,220}?[.!?])(?:\s|$)", text)
    if match:
        return match.group(1).strip()
    return re.sub(r"\s+", " ", text).strip()[:220]


def _clean_context_value(value: Any, *, limit: int = 240) -> str:
    if not isinstance(value, str):
        return ""
    cleaned = value.replace("\x00", "").replace("\r", " ").replace("\n", " ")
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned[:limit]


def _build_case_context_block(user_context: dict | None) -> str:
    if not user_context:
        return ""
    raw_context = user_context.get("case_context")
    if not isinstance(raw_context, dict):
        return ""

    situation = _clean_context_value(raw_context.get("situation_label"), limit=128)
    opponent = _clean_context_value(raw_context.get("opponent_role"), limit=128)
    desired_output = _clean_context_value(raw_context.get("desired_output"), limit=64)
    stakes = _clean_context_value(raw_context.get("stakes"), limit=300)
    success_criteria = _clean_context_value(raw_context.get("success_criteria"), limit=300)

    lines = ["КОНТЕКСТ КЕЙСА:"]
    if situation:
        lines.append(f"- Ситуация: {situation}")
    if opponent:
        lines.append(f"- Оппонент/адресат давления: {opponent}")
    if desired_output:
        lines.append(f"- Ожидаемый результат: {desired_output}")
    if stakes:
        lines.append(f"- Ставка встречи: {stakes}")
    if success_criteria:
        lines.append(f"- Критерий успеха: {success_criteria}")

    if len(lines) == 1:
        return ""
    lines.append(
        "Подстрой pressure scan, Defense Brief и improved_text под этот кейс. "
        "Не превращай задачу в общий улучшатель текста и не выдумывай факты."
    )
    return "\n".join(lines) + "\n\n"


def _build_analysis_prompt(text: str, user_context: dict | None = None) -> str:
    context_parts: list[str] = []
    if user_context:
        seg = _SEGMENT_LABELS.get(user_context.get("segment", ""), "")
        goal = _GOAL_LABELS.get(user_context.get("goal", ""), "")
        if seg or goal:
            context_parts.append(
                f"ПРОФИЛЬ УЧАСТНИКА:\n- Роль: {seg}\n- Цель: {goal}\n"
                "Подстрой тон обратной связи, примеры и рекомендации под бэкграунд и задачу этого человека."
            )
        case_context_block = _build_case_context_block(user_context).strip()
        if case_context_block:
            context_parts.append(case_context_block)

    prefix = "\n\n".join(context_parts)
    if prefix:
        prefix += "\n\n"
    return prefix + _ANALYSIS_USER_TEMPLATE.format(text=text)


def _fallback_defense_brief(feedback: dict) -> dict[str, list[str]]:
    raw_annotations = feedback.get("annotations")
    annotations = raw_annotations if isinstance(raw_annotations, list) else []

    evidence_gaps: list[str] = []
    pressure_questions: list[str] = []
    for annotation in annotations:
        if not isinstance(annotation, dict):
            continue
        comment = _first_sentence(annotation.get("comment"))
        if comment:
            pressure_questions.append(comment)
        if annotation.get("issue_type") in {"logic", "clarity"}:
            fragment = annotation.get("text")
            if isinstance(fragment, str) and fragment.strip():
                evidence_gaps.append(f"«{fragment.strip()[:90]}»: {comment}" if comment else fragment.strip()[:160])
            elif comment:
                evidence_gaps.append(comment)

    next_moves = [
        _first_sentence(feedback.get("logic")),
        _first_sentence(feedback.get("clarity")),
        _first_sentence(feedback.get("style")),
    ]

    return {
        "evidence_gaps": _clean_string_list(evidence_gaps),
        "pressure_questions": _clean_string_list(pressure_questions),
        "next_moves": _clean_string_list(next_moves),
    }


def _normalize_defense_brief(feedback: dict) -> None:
    fallback = _fallback_defense_brief(feedback)
    raw = feedback.get("defense_brief")
    raw_brief = raw if isinstance(raw, dict) else {}
    normalized = {
        "evidence_gaps": _clean_string_list(raw_brief.get("evidence_gaps")),
        "pressure_questions": _clean_string_list(raw_brief.get("pressure_questions")),
        "next_moves": _clean_string_list(raw_brief.get("next_moves")),
    }
    for key, fallback_items in fallback.items():
        if not normalized[key]:
            normalized[key] = fallback_items
    feedback["defense_brief"] = normalized


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    retry=retry_if_exception_type((CloudRuAIError, json.JSONDecodeError)),
    reraise=True,
)
async def analyze_draft(text: str, user_context: dict | None = None) -> CloudRuAnalysisResult:
    client = create_cloud_ru_client()
    prompt = _build_analysis_prompt(text, user_context=user_context)

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

    _normalize_defense_brief(feedback)

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
