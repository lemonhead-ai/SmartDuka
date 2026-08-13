from dataclasses import dataclass


@dataclass(frozen=True)
class DialogueOption:
    id: str
    text_swahili: str
    text_english: str
    courtesy_points: int
    is_polite: bool


class LiteracyService:
    @staticmethod
    def get_courtesy_dialogues(customer_greeting: str) -> list[DialogueOption]:
        """Returns dialogue choices for responding to customer greetings politely."""
        return [
            DialogueOption(
                id="opt_1",
                text_swahili="Marahaba mama! Karibu sana katika duka letu leo.",
                text_english="Welcome mama! You are very welcome to our shop today.",
                courtesy_points=10,
                is_polite=True,
            ),
            DialogueOption(
                id="opt_2",
                text_swahili="Poa. Unataka nini?",
                text_english="Cool. What do you want?",
                courtesy_points=2,
                is_polite=False,
            ),
            DialogueOption(
                id="opt_3",
                text_swahili="Asante sana! Nipo hapa kukusaidia kupata bidhaa bora.",
                text_english="Thank you very much! I am here to help you get the best goods.",
                courtesy_points=8,
                is_polite=True,
            ),
        ]

    @staticmethod
    def evaluate_discount_math(original_price: int, discount_percent: int, user_answer: int) -> dict:
        discount_amount = int(original_price * (discount_percent / 100.0))
        correct_discounted_price = original_price - discount_amount
        is_correct = user_answer == correct_discounted_price
        return {
            "is_correct": is_correct,
            "original_price": original_price,
            "discount_percent": discount_percent,
            "discount_amount": discount_amount,
            "correct_price": correct_discounted_price,
            "explanation": f"KES {original_price} minus {discount_percent}% (KES {discount_amount}) = KES {correct_discounted_price}",
        }
