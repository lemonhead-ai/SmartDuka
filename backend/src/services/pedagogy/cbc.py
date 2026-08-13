from dataclasses import dataclass
from enum import Enum


class CbcStrand(str, Enum):
    NUMBERS = "1.0_numbers"
    MEASUREMENT = "2.0_measurement"
    LANGUAGE = "3.0_language"
    HYGIENE_SCIENCE = "4.0_hygiene_science"


@dataclass(frozen=True)
class CbcCompetency:
    id: str
    grade_level: str  # e.g., "Grade 1", "Grade 2", "Grade 3"
    strand: CbcStrand
    sub_strand: str
    description: str
    target_skill: str


# KICD (Kenya Institute of Curriculum Development) Grade 1-4 Competency Mapping Matrix
CBC_COMPETENCY_MATRIX: list[CbcCompetency] = [
    CbcCompetency(
        id="CBC-MATH-G1-01",
        grade_level="Grade 1",
        strand=CbcStrand.NUMBERS,
        sub_strand="1.1 Counting & Value",
        description="Counting single-digit items and identifying currency coins/notes up to KES 50",
        target_skill="counting",
    ),
    CbcCompetency(
        id="CBC-MATH-G1-02",
        grade_level="Grade 1",
        strand=CbcStrand.NUMBERS,
        sub_strand="1.2 Single-Digit Addition",
        description="Adding prices of 2 basic items without carrying",
        target_skill="addition_basic",
    ),
    CbcCompetency(
        id="CBC-MATH-G2-01",
        grade_level="Grade 2",
        strand=CbcStrand.NUMBERS,
        sub_strand="1.3 Two-Digit Addition & Subtraction",
        description="Calculating total basket price and simple change calculation from KES 100",
        target_skill="addition_change",
    ),
    CbcCompetency(
        id="CBC-MATH-G2-02",
        grade_level="Grade 2",
        strand=CbcStrand.MEASUREMENT,
        sub_strand="2.1 Money & Financial Literacy",
        description="Calculating profit/loss and tracking remaining credit in Daftari ya Deni",
        target_skill="credit_ledger_math",
    ),
    CbcCompetency(
        id="CBC-MATH-G3-01",
        grade_level="Grade 3",
        strand=CbcStrand.NUMBERS,
        sub_strand="1.4 Multiplication as Repeated Addition",
        description="Calculating quantity bulk prices (e.g., 3 packets of milk at KES 60 each)",
        target_skill="multiplication",
    ),
    CbcCompetency(
        id="CBC-MATH-G3-02",
        grade_level="Grade 3",
        strand=CbcStrand.MEASUREMENT,
        sub_strand="2.2 Discounts & Percentage Savings",
        description="Calculating item bundle savings and discount subtractions",
        target_skill="discounts",
    ),
    CbcCompetency(
        id="CBC-LANG-G1-01",
        grade_level="Grade 1-3",
        strand=CbcStrand.LANGUAGE,
        sub_strand="3.1 Swahili & English Vocabulary",
        description="Reading shopping lists and matching item labels in Swahili and English",
        target_skill="shopping_list_reading",
    ),
    CbcCompetency(
        id="CBC-LANG-G2-01",
        grade_level="Grade 1-3",
        strand=CbcStrand.LANGUAGE,
        sub_strand="3.2 Courtesy & Social Greetings",
        description="Selecting polite greetings (Habari, Shikamoo, Karibu) to build shop reputation",
        target_skill="dialogue_courtesy",
    ),
    CbcCompetency(
        id="CBC-SCI-G2-01",
        grade_level="Grade 2-3",
        strand=CbcStrand.HYGIENE_SCIENCE,
        sub_strand="4.1 Food Safety & Shelf Storage",
        description="Sorting perishables into cooler/fridge and non-perishables into pantry",
        target_skill="perishable_sorting",
    ),
]


def get_competency_for_skill(skill: str) -> CbcCompetency | None:
    """Find the corresponding CBC Competency definition for a given gameplay skill tag."""
    for comp in CBC_COMPETENCY_MATRIX:
        if comp.target_skill == skill:
            return comp
    return CBC_COMPETENCY_MATRIX[0]
