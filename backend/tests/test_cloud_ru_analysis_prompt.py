from app.services import cloud_ru_ai


def test_analysis_prompt_is_meeting_defense_oriented() -> None:
    prompt = cloud_ru_ai._ANALYSIS_USER_TEMPLATE.format(
        text="Нам нужно защитить бюджет roadmap перед CFO."
    )

    assert "реальной рабочей встречи" in prompt
    assert "pressure scan" in prompt
    assert "defense-ready" in prompt
    assert "цена компромисса" in prompt
    assert "ожидаемое возражение" in prompt
    assert '"defense_brief"' in prompt
    assert '"evidence_gaps"' in prompt
    assert '"pressure_questions"' in prompt
    assert '"next_moves"' in prompt
    assert "Не выдумывай факты" in prompt
    assert "публичных выступлений" in prompt


def test_analysis_prompt_preserves_existing_json_contract() -> None:
    prompt = cloud_ru_ai._ANALYSIS_USER_TEMPLATE.format(text="Материал встречи")

    assert '"improved_text"' in prompt
    assert '"feedback"' in prompt
    assert '"logic"' in prompt
    assert '"style"' in prompt
    assert '"clarity"' in prompt
    assert '"grammar"' in prompt
    assert '"overall_score"' in prompt
    assert '"annotations"' in prompt
    assert '"defense_brief"' in prompt
    assert "<logic|style|clarity|grammar>" in prompt


def test_analysis_prompt_includes_case_context() -> None:
    prompt = cloud_ru_ai._build_analysis_prompt(
        "Нужно защитить бюджет перед CFO.",
        user_context={
            "case_context": {
                "situation_label": "Защита бюджета",
                "opponent_role": "CFO",
                "desired_output": "pressure_scan",
            }
        },
    )

    assert "КОНТЕКСТ КЕЙСА" in prompt
    assert "Защита бюджета" in prompt
    assert "CFO" in prompt
    assert "pressure_scan" in prompt
    assert "Подстрой pressure scan" in prompt


def test_analysis_feedback_normalizes_missing_defense_brief() -> None:
    feedback = {
        "logic": "Не хватает цифры по цене задержки.",
        "style": "Тон выдерживает давление, но звучит слишком общо.",
        "clarity": "Ask нужно сформулировать как конкретное решение.",
        "grammar": "Критичных языковых ошибок нет.",
        "overall_score": 6,
        "annotations": [
            {
                "text": "релиз сдвинется",
                "issue_type": "logic",
                "comment": "CFO спросит, сколько стоит задержка. Например: «релиз сдвинется» → «задержка стоит X рублей revenue».",
                "severity": "high",
            }
        ],
    }

    cloud_ru_ai._normalize_defense_brief(feedback)

    brief = feedback["defense_brief"]
    assert brief["evidence_gaps"]
    assert brief["pressure_questions"]
    assert brief["next_moves"]
