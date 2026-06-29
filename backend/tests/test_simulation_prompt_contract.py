from app.routers import guest_simulation
from app.services import simulation_ai


def test_simulation_system_prompt_is_meeting_case_pressure_test() -> None:
    prompt, is_followup, is_curveball = simulation_ai._build_system_prompt(
        persona_config={"role": "investor", "industry": "SaaS", "difficulty": 4},
        user_context=None,
        last_user_message=None,
        turn_index=0,
    )

    assert is_followup is False
    assert is_curveball is False
    assert "стресс-тесте материала перед рабочей встречей" in prompt
    assert "Ты не интервьюер" in prompt
    assert "материалу встречи" in prompt
    assert "цену компромисса" in prompt
    assert "Не выдумывай факты" in prompt
    assert "generic public speaking" in prompt


def test_simulation_system_prompt_clamps_invalid_difficulty() -> None:
    prompt, _, _ = simulation_ai._build_system_prompt(
        persona_config={"role": "investor", "industry": "SaaS", "difficulty": 99},
        user_context=None,
        last_user_message=None,
        turn_index=0,
    )

    assert "Уровень сложности: 5/5" in prompt
    assert "99/5" not in prompt


def test_simulation_system_prompt_includes_case_context() -> None:
    prompt, _, _ = simulation_ai._build_system_prompt(
        persona_config={
            "role": "cfo",
            "industry": "SaaS",
            "difficulty": 4,
            "case_context": {
                "situation_label": "Защита бюджета",
                "opponent_role": "CFO",
                "desired_output": "pressure_scan",
            },
        },
        user_context=None,
        last_user_message=None,
        turn_index=0,
    )

    assert "КОНТЕКСТ КЕЙСА" in prompt
    assert "Защита бюджета" in prompt
    assert "CFO" in prompt
    assert "pressure_scan" in prompt
    assert "не как общий тренажёр" in prompt


def test_legacy_journalist_role_is_mapped_to_working_committee_language() -> None:
    prompt, _, _ = simulation_ai._build_system_prompt(
        persona_config={"role": "journalist", "industry": "SaaS", "difficulty": 4},
        user_context=None,
        last_user_message=None,
        turn_index=0,
    )

    assert "Скептичный член комитета" in prompt
    assert "пресс-конференции" not in prompt
    assert "публичном резонансе" not in prompt


def test_build_user_prompt_anchors_first_question_in_meeting_material() -> None:
    prompt = simulation_ai._build_user_prompt(
        "Нужно защитить бюджет Q3: без найма релиз сдвинется на месяц.",
        history=[],
    )

    assert "МАТЕРИАЛ ВСТРЕЧИ / MEETING CASE" in prompt
    assert "НАЧНИ стресс-тест" in prompt
    assert "самый слабый, дорогой или спорный участок материала встречи" in prompt
    assert "презентац" not in prompt.lower()


def test_build_user_prompt_without_material_starts_from_decision_stakes() -> None:
    prompt = simulation_ai._build_user_prompt("", history=[])

    assert "Материал встречи не предоставлен" in prompt
    assert "решение, ставку, доказательства и критерий успеха" in prompt
    assert "широкий стартовый вопрос" not in prompt


def test_build_user_prompt_followup_uses_conversation_and_unchecked_risk() -> None:
    prompt = simulation_ai._build_user_prompt(
        "Материал: нужно отстоять roadmap перед CFO.",
        history=[
            {"role": "assistant", "content": "Почему это нельзя сократить?"},
            {"role": "user", "content": "Потому что команда не успеет релиз."},
        ],
    )

    assert "ДИАЛОГ НА ДАННЫЙ МОМЕНТ" in prompt
    assert "Опирайся на разговор и материал встречи" in prompt
    assert "непроверенный риск" in prompt


def test_evaluation_prompt_does_not_drift_into_interview_or_resume_coaching() -> None:
    prompt = simulation_ai._SKILL_EVAL_TEMPLATE
    lower_prompt = prompt.lower()

    assert "резюме" not in lower_prompt
    assert "интервью" not in lower_prompt
    assert "собеседующий" not in lower_prompt
    assert "стресс-теста материала перед рабочей встречей" in prompt
    assert "На реальной встрече оппонент" in prompt
    assert "Как исправить:" in prompt
    assert "**Как исправить:**" not in prompt
    assert "Оцени КАЖДУЮ зону защиты позиции" in prompt
    assert "Доказательность" in prompt
    assert "План ответа на встрече" in prompt
    assert "Ясность изложения" not in prompt
    assert "Стрессоустойчивость" not in prompt


def test_prep_card_and_guest_paywall_use_opponent_and_case_language() -> None:
    assert "Q: вопрос оппонента" in simulation_ai._PREP_CARD_USER_TEMPLATE
    assert "evidence_gaps" in simulation_ai._PREP_CARD_USER_TEMPLATE
    assert "pressure_questions" in simulation_ai._PREP_CARD_USER_TEMPLATE
    assert "next_moves" in simulation_ai._PREP_CARD_USER_TEMPLATE
    assert "дыр в доказательствах" in simulation_ai._PREP_CARD_USER_TEMPLATE
    assert "интервьюера" not in simulation_ai._PREP_CARD_USER_TEMPLATE

    assert guest_simulation._PAYWALL_RESPONSE["message"] == "Быстрый pressure scan по материалу завершён"
    assert guest_simulation._PAYWALL_RESPONSE["cta_primary"]["text"] == "Собрать Defense Brief — 299 ₽"
    assert guest_simulation._PAYWALL_RESPONSE["cta_secondary"]["text"] == "Сохранить материал встречи и вернуться позже"
