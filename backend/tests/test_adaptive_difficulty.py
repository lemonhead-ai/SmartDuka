from src.services.gameplay.managers import AdaptiveDifficultyEngine


def test_adaptive_difficulty_uses_a_three_attempt_window() -> None:
    engine = AdaptiveDifficultyEngine()

    assert engine.adjust(3, attempts=2, correct=2) == 3
    assert engine.adjust(3, attempts=3, correct=3) == 4
    assert engine.adjust(3, attempts=3, correct=0) == 2
    assert engine.adjust(1, attempts=3, correct=0) == 1
    assert engine.adjust(7, attempts=3, correct=3) == 7
