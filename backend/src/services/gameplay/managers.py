from dataclasses import dataclass
from datetime import date, timedelta
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
            raise ValueError(f"Not enough stock is available. (current={current}, quantity={quantity}, stock={stock}, lines={len(lines)})")
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


class LiteracyChallengeManager:
    """Creates short, shop-native literacy moments from a customer's real order."""

    _swahili_words = {
        "banana": "ndizi",
        "bread": "mkate",
        "egg": "yai",
        "exercise book": "daftari",
        "juice": "juisi",
        "mandazi": "mandazi",
        "mango": "embe",
        "milk": "maziwa",
        "pencil": "penseli",
        "soap": "sabuni",
        "sugar": "sukari",
        "tomato": "nyanya",
    }
    _conversation_prompts = (
        (
            "How much is this?",
            "Hii ni bei gani?",
            ("Hii ni bei gani?", "Ningependa mkate mbili.", "Asante sana."),
        ),
        (
            "Asante sana.",
            "Thank you very much.",
            ("Thank you very much.", "Please give me milk.", "Where is the shop?"),
        ),
        (
            "I would like two loaves of bread.",
            "Ningependa mikate miwili.",
            ("Ningependa mikate miwili.", "Mkate huu ni wa bei gani?", "Asante sana."),
        ),
    )

    def create(
        self,
        customer: dict[str, object],
        *,
        tier: int,
        age: int,
        served: int,
        available_item_names: list[str],
    ) -> dict[str, object] | None:
        requested = [item for item in customer.get("requested_items", []) if isinstance(item, dict)]
        if not requested:
            return None

        normalized_tier = max(1, min(7, tier))
        target = requested[served % len(requested)]
        target_name = str(target["name"])
        challenge_type = self._challenge_type(normalized_tier, age, served)
        if challenge_type == "word_reading":
            return self._word_reading(target, target_name, normalized_tier)
        if challenge_type == "sentence_reading":
            return self._sentence_reading(
                target, target_name, normalized_tier, requested, available_item_names
            )
        if challenge_type == "spelling":
            spelling_target = self._spelling_target(requested, target)
            return self._spelling(spelling_target, normalized_tier)
        return self._conversation(normalized_tier, served)

    @staticmethod
    def _challenge_type(tier: int, age: int, served: int) -> str:
        if tier <= 2:
            return "word_reading"
        if tier == 3:
            return "sentence_reading" if served % 2 == 0 else "word_reading"
        if tier == 4:
            return "spelling" if served % 2 == 0 else "sentence_reading"
        if age >= 10 and served % 2 == 0:
            return "conversation"
        return "spelling" if served % 2 else "sentence_reading"

    def _word_reading(
        self, target: dict[str, object], target_name: str, tier: int
    ) -> dict[str, object]:
        word = target_name if tier == 1 else self._swahili_words.get(target_name.casefold(), target_name)
        language = "English" if tier == 1 else "Kiswahili"
        return self._challenge(
            challenge_type="word_reading",
            prompt=f"{language} shop word: find the matching item on the shelf.",
            content=word,
            tier=tier,
            answer=str(target["item_id"]),
            target_item_id=str(target["item_id"]),
        )

    def _sentence_reading(
        self,
        target: dict[str, object],
        target_name: str,
        tier: int,
        requested: list[dict[str, object]],
        available_item_names: list[str],
    ) -> dict[str, object]:
        quantity = int(target["quantity"])
        detail = " It is for my family at home." if tier >= 4 else ""
        note = (
            "Dear shopkeeper,\n"
            f"Please put {quantity} {target_name.lower()} in my basket.{detail}\n"
            "Which item should you choose first?"
        )
        options = [target_name]
        for item in requested:
            name = str(item["name"])
            if name not in options:
                options.append(name)
        for name in available_item_names:
            if name not in options:
                options.append(name)
            if len(options) == 3:
                break
        return self._challenge(
            challenge_type="sentence_reading",
            prompt="A customer handed you a shopping note. Read it, then answer.",
            content=note,
            tier=tier,
            answer="choice-0",
            choices=[{"id": f"choice-{index}", "label": name} for index, name in enumerate(options[:3])],
            target_item_id=str(target["item_id"]),
        )

    @staticmethod
    def _spelling_target(
        requested: list[dict[str, object]], target: dict[str, object]
    ) -> dict[str, object]:
        return next(
            (
                item
                for item in requested
                if str(item["name"]).isalpha() and len(str(item["name"])) >= 4
            ),
            target,
        )

    def _spelling(self, target: dict[str, object], tier: int) -> dict[str, object]:
        word = str(target["name"]).casefold().replace(" ", "")
        missing_indexes = [1] if len(word) < 7 or tier < 6 else [1, 3]
        missing_letters = "".join(word[index] for index in missing_indexes)
        pattern = " ".join("_" if index in missing_indexes else letter for index, letter in enumerate(word))
        distractors = [letter for letter in "aeioub" if letter not in missing_letters]
        letters = list(dict.fromkeys([*missing_letters, *distractors]))[:6]
        return self._challenge(
            challenge_type="spelling",
            prompt="Before we total the basket, use the letter tiles to finish this shop word.",
            content=pattern,
            tier=tier,
            answer=missing_letters,
            letter_options=letters,
            target_item_id=str(target["item_id"]),
        )

    def _conversation(self, tier: int, served: int) -> dict[str, object]:
        phrase, meaning, options = self._conversation_prompts[served % len(self._conversation_prompts)]
        return self._challenge(
            challenge_type="conversation",
            prompt="Your customer is speaking. Choose the meaning that helps you reply kindly.",
            content=f"“{phrase}”",
            tier=tier,
            answer="choice-0",
            choices=[{"id": f"choice-{index}", "label": option} for index, option in enumerate(options)],
        )

    @staticmethod
    def _challenge(
        *,
        challenge_type: str,
        prompt: str,
        content: str,
        tier: int,
        answer: str,
        choices: list[dict[str, str]] | None = None,
        letter_options: list[str] | None = None,
        target_item_id: str | None = None,
    ) -> dict[str, object]:
        return {
            "id": str(uuid4()),
            "type": challenge_type,
            "prompt": prompt,
            "content": content,
            "choices": choices or [],
            "letter_options": letter_options or [],
            "difficulty_tier": tier,
            "attempts": 0,
            "complete": False,
            "answer": answer,
            "target_item_id": target_item_id,
        }

    @staticmethod
    def is_correct(challenge: dict[str, object], answer: str) -> bool:
        return answer.strip().casefold() == str(challenge["answer"]).strip().casefold()

    @staticmethod
    def feedback(challenge: dict[str, object], correct: bool, customer_name: str) -> str:
        if correct:
            if challenge["type"] == "word_reading":
                return f"Great reading! You found the right item for {customer_name}."
            if challenge["type"] == "sentence_reading":
                return "Lovely reading! You followed the customer's note carefully."
            if challenge["type"] == "spelling":
                return "Well spelled! That shop word is ready for the counter."
            return "Wonderful listening! You understood what your customer said."
        attempts = int(challenge["attempts"])
        if attempts == 1:
            return "Good try. Read the customer message once more, then look for the key word."
        return "Almost there. Take your timeâ€”the customer is happy to wait while you think."


class MathChallengeManager:
    def create_checkout_challenge(
        self,
        total_kes: int,
        tier: int,
        customer: dict[str, object] | None = None,
        basket_lines: list[dict[str, object]] | None = None,
    ) -> dict[str, object]:
        lines = basket_lines or []
        normalized_tier = max(1, min(7, tier))

        if normalized_tier >= 5:
            divisor = next((value for value in (2, 3, 4) if total_kes % value == 0), None)
            if divisor is not None:
                tender = self._tender(total_kes, customer)
                return self._challenge(
                    prompt=(
                        f"{divisor} friends are sharing this shopping bill of KES {total_kes} equally. "
                        "How much should each friend pay?"
                    ),
                    skill="division",
                    answer=total_kes // divisor,
                    tier=normalized_tier,
                    total_kes=total_kes,
                    amount_due_kes=total_kes,
                    amount_paid_kes=tender,
                )

        if normalized_tier >= 4 and len(lines) >= 2:
            discount = max(1, total_kes // 10)
            amount_due = total_kes - discount
            tender = self._tender(amount_due, customer)
            return self._challenge(
                prompt=(
                    f"This basket has a 10% bundle discount. The items cost KES {total_kes} before the discount. "
                    "How many shillings is the discount?"
                ),
                skill="discount",
                answer=discount,
                tier=normalized_tier,
                total_kes=total_kes,
                amount_due_kes=amount_due,
                amount_paid_kes=tender,
                discount_kes=discount,
            )

        if normalized_tier >= 3:
            quantity_line = next(
                (line for line in lines if int(line.get("quantity", 0)) >= 2),
                None,
            )
            if quantity_line is not None:
                quantity = int(quantity_line["quantity"])
                price = int(quantity_line["price_kes"])
                item_name = str(quantity_line["name"]).lower()
                tender = self._tender(total_kes, customer)
                return self._challenge(
                    prompt=(
                        f"{quantity} {item_name} cost KES {price} each. "
                        "What is the cost of those items together?"
                    ),
                    skill="multiplication",
                    answer=quantity * price,
                    tier=normalized_tier,
                    total_kes=total_kes,
                    amount_due_kes=total_kes,
                    amount_paid_kes=tender,
                )

        tender = self._tender(total_kes, customer)
        question = (
            str(customer.get("checkout_question", "How much change should I receive?"))
            if customer
            else "How much change should I receive?"
        )
        return self._challenge(
            prompt=f"{question} Basket total: KES {total_kes}. Amount paid: KES {tender}.",
            skill="change",
            answer=tender - total_kes,
            tier=normalized_tier,
            total_kes=total_kes,
            amount_due_kes=total_kes,
            amount_paid_kes=tender,
        )

    @staticmethod
    def _tender(amount_due_kes: int, customer: dict[str, object] | None) -> int:
        tender = int(customer.get("payment_amount_kes", 0)) if customer else 0
        if tender <= amount_due_kes:
            tender = max(100, ((amount_due_kes + 49) // 50) * 50)
            if tender == amount_due_kes:
                tender += 50
        return tender

    @staticmethod
    def _challenge(
        *,
        prompt: str,
        skill: str,
        answer: int,
        tier: int,
        total_kes: int,
        amount_due_kes: int,
        amount_paid_kes: int,
        discount_kes: int = 0,
    ) -> dict[str, object]:
        return {
            "id": str(uuid4()),
            "prompt": prompt,
            "skill": skill,
            "answer": answer,
            "difficulty_tier": tier,
            "attempts": 0,
            "hints_used": 0,
            "complete": False,
            "total_kes": total_kes,
            "amount_due_kes": amount_due_kes,
            "amount_paid_kes": amount_paid_kes,
            "discount_kes": discount_kes,
        }

    def hint(self, challenge: dict[str, object]) -> str:
        if challenge["skill"] == "multiplication":
            return "Count equal groups: the price of one item, added once for each item."
        if challenge["skill"] == "discount":
            return "Ten percent means one out of every ten shillings. Divide the total by 10."
        if challenge["skill"] == "division":
            return "Share the total into equal groups, one friend at a time."
        if challenge["skill"] == "change" and int(challenge["hints_used"]) <= 1:
            return "Start at the basket total and count up to the amount paid."
        if challenge["skill"] == "change":
            return "Write it as money received minus the basket total, then subtract carefully."
        return "Add each item price carefully, one at a time."


class ScoringEngine:
    def feedback(self, correct: bool, attempts: int, challenge: dict[str, object]) -> str:
        skill = str(challenge.get("skill", "change"))
        if correct and skill == "change":
            return (
                f"Correct! KES {challenge['amount_paid_kes']} - KES {challenge['total_kes']} = "
                f"KES {challenge['answer']}."
            )
        if correct and skill == "multiplication":
            return f"Correct! {challenge['prompt'].split('.')[0]} = KES {challenge['answer']}."
        if correct and skill == "discount":
            return f"Correct! The bundle saves KES {challenge['answer']}, so the customer pays KES {challenge['amount_due_kes']}."
        if correct and skill == "division":
            return f"Correct! Each friend pays KES {challenge['answer']}."
        if attempts == 1:
            return "Not quite. Try the first small step again and use the numbers in the shopping story."
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


class MotivationManager:
    """Own the small, durable motivation loop without consuming AI capacity."""

    _MISSION_TEMPLATES = (
        {
            "id": "daily-helpful-shopkeeper",
            "title": "Helpful Shopkeeper",
            "description": "Complete 2 happy customer sales.",
            "kind": "sales",
            "target": 2,
        },
        {
            "id": "daily-number-navigator",
            "title": "Number Navigator",
            "description": "Solve 3 checkout maths moments.",
            "kind": "math",
            "target": 3,
        },
        {
            "id": "daily-reading-star",
            "title": "Reading Star",
            "description": "Complete 2 customer reading moments.",
            "kind": "literacy",
            "target": 2,
        },
    )

    _BADGES = {
        "first-sale": {
            "id": "first-sale",
            "name": "First Sale",
            "description": "Completed a customer sale.",
        },
        "careful-calculator": {
            "id": "careful-calculator",
            "name": "Careful Calculator",
            "description": "Solved a checkout challenge without a hint.",
        },
        "reading-star": {
            "id": "reading-star",
            "name": "Reading Star",
            "description": "Completed a customer reading moment.",
        },
        "three-day-streak": {
            "id": "three-day-streak",
            "name": "Three-Day Streak",
            "description": "Came back to learn for three days in a row.",
        },
    }

    def start_day(self, state: dict[str, object] | None, today: date, seed: int) -> dict[str, object]:
        updated = dict(state or {})
        today_value = today.isoformat()
        last_played = updated.get("last_played_on")
        if last_played != today_value:
            previous = self._parse_date(last_played)
            streak = int(updated.get("current_streak_days", 0))
            updated["current_streak_days"] = streak + 1 if previous == today - timedelta(days=1) else 1
            updated["last_played_on"] = today_value

        mission = updated.get("daily_mission")
        if not isinstance(mission, dict) or mission.get("date") != today_value:
            template = self._MISSION_TEMPLATES[(today.toordinal() + seed) % len(self._MISSION_TEMPLATES)]
            updated["daily_mission"] = {
                **template,
                "date": today_value,
                "progress": 0,
                "completed": False,
            }
        updated.setdefault("badges", [])
        self._award(updated, "three-day-streak" if int(updated["current_streak_days"]) >= 3 else None)
        return updated

    def record_event(self, state: dict[str, object], event: str) -> tuple[dict[str, object], bool]:
        updated = dict(state)
        mission = dict(updated.get("daily_mission") or {})
        completed_now = False
        if mission.get("kind") == event and not bool(mission.get("completed")):
            mission["progress"] = min(int(mission.get("progress", 0)) + 1, int(mission["target"]))
            if int(mission["progress"]) >= int(mission["target"]):
                mission["completed"] = True
                completed_now = True
        updated["daily_mission"] = mission
        return updated, completed_now

    def award_for_event(
        self, state: dict[str, object], event: str, *, used_hint: bool = False
    ) -> tuple[dict[str, object], list[dict[str, str]]]:
        updated = dict(state)
        before = {str(badge.get("id")) for badge in self._badges(updated)}
        if event == "sale":
            self._award(updated, "first-sale")
        elif event == "math" and not used_hint:
            self._award(updated, "careful-calculator")
        elif event == "literacy":
            self._award(updated, "reading-star")
        after = self._badges(updated)
        return updated, [badge for badge in after if badge["id"] not in before]

    def response(self, state: dict[str, object]) -> dict[str, object]:
        mission = dict(state.get("daily_mission") or {})
        return {
            "daily_mission": {
                "id": str(mission["id"]),
                "title": str(mission["title"]),
                "description": str(mission["description"]),
                "kind": str(mission["kind"]),
                "progress": int(mission.get("progress", 0)),
                "target": int(mission["target"]),
                "completed": bool(mission.get("completed")),
            },
            "current_streak_days": int(state.get("current_streak_days", 0)),
            "badges": self._badges(state),
        }

    def _award(self, state: dict[str, object], badge_id: str | None) -> None:
        if badge_id is None:
            return
        badges = self._badges(state)
        if badge_id not in {badge["id"] for badge in badges}:
            badges.append(dict(self._BADGES[badge_id]))
        state["badges"] = badges

    @staticmethod
    def _badges(state: dict[str, object]) -> list[dict[str, str]]:
        return [
            {"id": str(badge["id"]), "name": str(badge["name"]), "description": str(badge["description"])}
            for badge in state.get("badges", [])
            if isinstance(badge, dict)
            and {"id", "name", "description"}.issubset(badge)
        ]

    @staticmethod
    def _parse_date(value: object) -> date | None:
        try:
            return date.fromisoformat(str(value))
        except ValueError:
            return None


class LearningSummaryManager:
    """Turn saved learning signals into concise, useful adult-facing language."""

    def build(
        self,
        *,
        student_name: str,
        questions_attempted: int,
        correct_answers: int,
        hints_used: int,
        learning_level: int,
        streak_days: int,
        badges: list[dict[str, str]],
        literacy_moments_completed: int,
        skills_improving: list[str],
    ) -> dict[str, object]:
        accuracy = round((correct_answers / questions_attempted) * 100) if questions_attempted else 0
        celebrations = self._celebrations(
            questions_attempted, correct_answers, streak_days, badges, literacy_moments_completed
        )
        support_focus, suggested_activity = self._support(questions_attempted, accuracy, hints_used)
        strength_labels = [skill.replace("_", " ").title() for skill in skills_improving]
        if literacy_moments_completed:
            strength_labels.append("Reading through customer conversations")
        if not strength_labels and questions_attempted:
            strength_labels.append("Building confidence through shop play")
        if not strength_labels:
            strength_labels.append("Getting comfortable with the duka routine")
        return {
            "student_name": student_name,
            "questions_attempted": questions_attempted,
            "correct_answers": correct_answers,
            "literacy_moments_completed": literacy_moments_completed,
            "parent_summary": {
                "headline": self._headline(student_name, questions_attempted, accuracy),
                "celebrations": celebrations,
                "next_step": suggested_activity,
            },
            "teacher_summary": {
                "accuracy_percent": accuracy,
                "learning_level": learning_level,
                "strengths": strength_labels,
                "support_focus": support_focus,
                "suggested_activity": suggested_activity,
            },
        }

    @staticmethod
    def _headline(student_name: str, attempts: int, accuracy: int) -> str:
        if attempts == 0:
            return f"{student_name} is ready to begin a playful shop-learning journey."
        if accuracy >= 80:
            return f"{student_name} is confidently applying shop maths and reading skills."
        if accuracy >= 50:
            return f"{student_name} is growing through each customer conversation and checkout."
        return f"{student_name} is building confidence one small shop problem at a time."

    @staticmethod
    def _celebrations(
        attempts: int,
        correct: int,
        streak_days: int,
        badges: list[dict[str, str]],
        literacy_moments_completed: int,
    ) -> list[str]:
        celebrations: list[str] = []
        if attempts:
            celebrations.append(f"Practised {attempts} learning moments and solved {correct} correctly.")
        if literacy_moments_completed:
            celebrations.append(
                f"Completed {literacy_moments_completed} customer reading moment"
                f"{'s' if literacy_moments_completed != 1 else ''}."
            )
        if streak_days:
            celebrations.append(f"Returned for a {streak_days}-day learning streak.")
        if badges:
            celebrations.append(f"Earned {len(badges)} badge{'s' if len(badges) != 1 else ''}.")
        return celebrations or ["Starting a duka is the first step toward a confident learner."]

    @staticmethod
    def _support(attempts: int, accuracy: int, hints_used: int) -> tuple[str, str]:
        if attempts == 0:
            return (
                "Begin with a short, friendly customer order.",
                "Play one customer round together and read the shopping request aloud.",
            )
        if accuracy < 50 or hints_used > attempts:
            return (
                "Use the hint first and break each money problem into one small step.",
                "Ask the learner to count each item cost aloud before calculating the total.",
            )
        if accuracy < 80:
            return (
                "Keep practising totals and change with familiar products.",
                "Try one extra customer today and invite the learner to explain their answer.",
            )
        return (
            "Gently stretch the learner with multi-item orders and a short reading note.",
            "Try a bundle or change challenge, then ask the learner to explain their thinking.",
        )


class ProgressTracker:
    @staticmethod
    def skills_improving(correct_answers: int) -> list[str]:
        return ["money", "change"] if correct_answers else []


class AdaptiveDifficultyEngine:
    """Adjust challenge tier from a short, forgiving window of attempts."""

    def adjust(self, current_tier: int, attempts: int, correct: int) -> int:
        tier = max(1, min(7, current_tier))
        if attempts < 3:
            return tier
        accuracy = correct / attempts
        if accuracy >= 0.8:
            return min(7, tier + 1)
        if accuracy <= 0.4:
            return max(1, tier - 1)
        return tier
