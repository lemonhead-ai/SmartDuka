from enum import StrEnum


class LanguageCode(StrEnum):
    SWAHILI = "sw"
    ENGLISH = "en"


class AgeBand(StrEnum):
    SPROUT = "sprout"
    GROWER = "grower"
    TRADER = "trader"
    ENTREPRENEUR = "entrepreneur"
