from enum import Enum


class ErrorTaxonomyCategory(str, Enum):
    ARITHMETIC_CALCULATION = "arithmetic_calculation"
    CREDIT_BALANCE = "credit_balance"
    READING_INTERPRETATION = "reading_interpretation"
    STORAGE_HYGIENE = "storage_hygiene"


class DiagnosticAnalyticsService:
    @staticmethod
    def classify_error(skill_tag: str, expected: str | int, actual: str | int) -> dict:
        if "credit" in skill_tag:
            category = ErrorTaxonomyCategory.CREDIT_BALANCE
            feedback = "Kagua kikomo cha deni katika Daftari ya Deni vizuri."
        elif "sorting" in skill_tag or "hygiene" in skill_tag:
            category = ErrorTaxonomyCategory.STORAGE_HYGIENE
            feedback = "Maziwa na mafuta yanahitaji kuwekwa katika sehemu ya baridi (Fridge)."
        elif "reading" in skill_tag or "dialogue" in skill_tag:
            category = ErrorTaxonomyCategory.READING_INTERPRETATION
            feedback = "Soma jina la bidhaa na maelezo ya mteja kwa makini."
        else:
            category = ErrorTaxonomyCategory.ARITHMETIC_CALCULATION
            feedback = "Hesabu jumla au chenji kwa umakini."

        return {
            "category": category.value,
            "skill_tag": skill_tag,
            "expected": expected,
            "actual": actual,
            "mascot_hint": feedback,
        }
