from src.agents.base.prompt_loader import PromptLoader


def test_tutor_prompt_requires_hint_before_answer() -> None:
    prompt = PromptLoader().load("tutor")

    assert "three consecutive mistakes" in prompt.content
    assert "never the final number" in prompt.content


def test_mission_prompt_uses_safe_local_storytelling() -> None:
    prompt = PromptLoader().load("missions")

    assert "Kenyan" in prompt.content
    assert "child-safe" in prompt.content
