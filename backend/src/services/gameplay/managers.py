from dataclasses import dataclass
from uuid import UUID, uuid4

from src.database.models import InventoryItem


@dataclass(frozen=True)
class BasketLine:
    item_id: UUID
    quantity: int


class ShopInventoryManager:
    @staticmethod
    def price(item: InventoryItem) -> int:
        return item.base_price_kes * item.price_multiplier_percent // 100


class BasketManager:
    def add(
        self, lines: list[BasketLine], item_id: UUID, quantity: int, stock: int
    ) -> list[BasketLine]:
        current = sum(line.quantity for line in lines if line.item_id == item_id)
        if current + quantity > stock:
            raise ValueError("Not enough stock is available.")
        return [line for line in lines if line.item_id != item_id] + [
            BasketLine(item_id, current + quantity)
        ]

    def remove(self, lines: list[BasketLine], item_id: UUID) -> list[BasketLine]:
        return [line for line in lines if line.item_id != item_id]


class CustomerQueueManager:
    _profiles = (
        ("Nia", "friendly", "Habari! I am happy to shop with you."),
        ("Kito", "curious", "Hello! Can we work this out together?"),
        ("Mama Asha", "parent", "Jambo! I have a small list for home."),
        ("Babu Juma", "elderly", "Good day, young shopkeeper."),
        ("Taji", "child", "Hi! I am buying a little treat."),
        ("Wanjiku", "busy", "Hello! I need a few things quickly, please."),
    )

    def next(self, served: int, items: list[InventoryItem]) -> dict[str, object]:
        name, personality, greeting = self._profiles[served % len(self._profiles)]
        first, second = items[served % len(items)], items[(served + 1) % len(items)]
        quantity = served % 3 + 1
        return {
            "id": str(uuid4()),
            "name": name,
            "personality": personality,
            "greeting": greeting,
            "request": (
                f"I need {quantity} {first.name.lower()} and 1 {second.name.lower()}, please."
            ),
        }


class MathChallengeManager:
    def create_checkout_challenge(self, total_kes: int, tier: int) -> dict[str, object]:
        tender = max(100, ((total_kes + 49) // 50) * 50)
        if tender == total_kes:
            return {
                "id": str(uuid4()),
                "prompt": "What is the total cost in KES?",
                "skill": "money",
                "answer": total_kes,
                "difficulty_tier": tier,
                "attempts": 0,
                "hints_used": 0,
                "complete": False,
            }
        return {
            "id": str(uuid4()),
            "prompt": (
                f"The basket costs KES {total_kes}. The customer pays KES {tender}. "
                "What change should they receive?"
            ),
            "skill": "change",
            "answer": tender - total_kes,
            "difficulty_tier": tier,
            "attempts": 0,
            "hints_used": 0,
            "complete": False,
        }

    def hint(self, challenge: dict[str, object]) -> str:
        if challenge["skill"] == "change":
            return "Start at the basket total and count up to the amount paid."
        return "Add each item price carefully, one at a time."


class ScoringEngine:
    def feedback(self, correct: bool, attempts: int) -> str:
        if correct:
            return "Great reasoning! You worked it out."
        if attempts == 1:
            return "Nice try. Let’s use a hint and solve it step by step."
        return "You are getting closer. Take your time and try the next step."


class XpCoinsEngine:
    def reward(self, correct: bool, attempts: int, hints: int) -> tuple[int, int, int]:
        if correct:
            return (8 if hints or attempts > 1 else 12, 15 if hints or attempts > 1 else 25, 1)
        return (2, 5, 0)


class AchievementEngine:
    def update(self, served: int, correct: bool, hints: int, achievements: list[str]) -> list[str]:
        earned = list(achievements)
        if served >= 1 and "First Sale" not in earned:
            earned.append("First Sale")
        if correct and hints == 0 and "Careful Calculator" not in earned:
            earned.append("Careful Calculator")
        return earned


class MissionProgressEngine:
    def progress(self, value: int, target: int = 3) -> dict[str, object]:
        return {
            "title": "Helpful Shopkeeper",
            "progress": value,
            "target": target,
            "completed": value >= target,
        }


class ProgressTracker:
    @staticmethod
    def skills_improving(correct_answers: int) -> list[str]:
        return ["money", "change"] if correct_answers else []
