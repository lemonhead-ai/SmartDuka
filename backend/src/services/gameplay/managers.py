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
            "requested_items": [
                {"item_id": str(first.id), "name": first.name, "quantity": quantity},
                {"item_id": str(second.id), "name": second.name, "quantity": 1},
            ],
        }


class BasketValidationManager:
    def validate(
        self, customer: dict[str, object] | None, selected: list[dict[str, object]]
    ) -> dict[str, object]:
        if customer is None:
            return {
                "is_valid": False,
                "missing_items": [],
                "unexpected_items": [],
                "quantity_mismatches": [],
                "tutor_feedback": "Serve a customer first, then build their basket.",
            }
        requested_items = [item for item in customer["requested_items"] if isinstance(item, dict)]
        selected_by_id = {str(item["item_id"]): item for item in selected}
        requested_by_id = {str(item["item_id"]): item for item in requested_items}
        missing_items: list[dict[str, object]] = []
        quantity_mismatches: list[dict[str, object]] = []
        unexpected_items: list[dict[str, object]] = []
        for item_id, requested in requested_by_id.items():
            selected_item = selected_by_id.get(item_id)
            expected = int(requested["quantity"])
            selected_quantity = int(selected_item["quantity"]) if selected_item else 0
            issue = {
                "item_id": requested["item_id"],
                "name": str(requested["name"]),
                "expected_quantity": expected,
                "selected_quantity": selected_quantity,
            }
            if selected_item is None:
                missing_items.append(issue)
            elif selected_quantity != expected:
                quantity_mismatches.append(issue)
        for item_id, selected_item in selected_by_id.items():
            if item_id not in requested_by_id:
                unexpected_items.append(
                    {
                        "item_id": selected_item["item_id"],
                        "name": str(selected_item["name"]),
                        "expected_quantity": 0,
                        "selected_quantity": int(selected_item["quantity"]),
                    }
                )
        return {
            "is_valid": not (missing_items or quantity_mismatches or unexpected_items),
            "missing_items": missing_items,
            "unexpected_items": unexpected_items,
            "quantity_mismatches": quantity_mismatches,
            "tutor_feedback": self._feedback(
                str(customer["name"]), missing_items, unexpected_items, quantity_mismatches
            ),
        }

    @staticmethod
    def _feedback(
        customer_name: str,
        missing_items: list[dict[str, object]],
        unexpected_items: list[dict[str, object]],
        quantity_mismatches: list[dict[str, object]],
    ) -> str:
        if not (missing_items or unexpected_items or quantity_mismatches):
            return f"Excellent! The basket is exactly what {customer_name} requested."
        if unexpected_items and missing_items:
            return (
                f"Almost! You picked {unexpected_items[0]['name'].lower()}, "
                f"but {customer_name} asked "
                f"for {missing_items[0]['name'].lower()}."
            )
        if missing_items:
            item = missing_items[0]
            return f"You still need {item['expected_quantity']} {item['name'].lower()}."
        if quantity_mismatches:
            item = quantity_mismatches[0]
            return (
                f"{customer_name} needs {item['expected_quantity']} {item['name'].lower()}, "
                f"but the basket has {item['selected_quantity']}."
            )
        item_name = str(unexpected_items[0]["name"]).lower()
        return f"{customer_name} did not ask for {item_name}. Try removing it."


class MathChallengeManager:
    def create_checkout_challenge(self, total_kes: int, tier: int, customer: dict[str, object] | None = None) -> dict[str, object]:
        if customer:
            tender = int(customer.get("payment_amount_kes", 0))
            if tender <= total_kes:
                # If AI's guessed payment is too small, round up total to next 50/100
                tender = ((total_kes + 49) // 50) * 50
                if tender == total_kes:
                    tender += 50
        else:
            tender = max(100, ((total_kes + 49) // 50) * 50)
            if tender == total_kes:
                tender += 50
        
        prompt = f"The basket total is KES {total_kes}. What is the total cost in KES?"
        if tender > total_kes:
            question = str(customer.get("checkout_question", "How much change should I receive?")) if customer else "How much change should I receive?"
            prompt = f"{question} Basket total: KES {total_kes}. Amount paid: KES {tender}."
            
        return {
            "id": str(uuid4()),
            "prompt": prompt,
            "skill": "change" if tender > total_kes else "money",
            "answer": tender - total_kes if tender > total_kes else total_kes,
            "difficulty_tier": tier,
            "attempts": 0,
            "hints_used": 0,
            "complete": False,
            "total_kes": total_kes,
            "amount_paid_kes": tender,
        }

    def hint(self, challenge: dict[str, object]) -> str:
        if challenge["skill"] == "change" and int(challenge["hints_used"]) <= 1:
            return "Start at the basket total and count up to the amount paid."
        if challenge["skill"] == "change":
            return "Write it as money received minus the basket total, then subtract carefully."
        return "Add each item price carefully, one at a time."


class ScoringEngine:
    def feedback(self, correct: bool, attempts: int, challenge: dict[str, object]) -> str:
        if correct:
            return (
                f"Correct! KES {challenge['amount_paid_kes']} - KES {challenge['total_kes']} = "
                f"KES {challenge['answer']}."
            )
        if attempts == 1:
            return "Not quite. Calculate the change as money received minus total cost."
        return "Try counting from the total up to the money received, one amount at a time."


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
