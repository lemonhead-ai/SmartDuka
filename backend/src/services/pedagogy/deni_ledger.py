from dataclasses import dataclass


@dataclass
class DeniEntry:
    customer_id: str
    customer_name: str
    avatar_url: str
    current_balance_kes: int
    credit_limit_kes: int
    trust_score: int  # 1 to 5 stars
    last_transaction: str


class DeniLedgerService:
    def __init__(self) -> None:
        # Pre-seeded community credit records for demo shopkeepers
        self._entries: dict[str, DeniEntry] = {
            "cust_1": DeniEntry(
                customer_id="cust_1",
                customer_name="Mama Omondi",
                avatar_url="/mascots/mama_omondi.svg",
                current_balance_kes=120,
                credit_limit_kes=300,
                trust_score=5,
                last_transaction="Uniti 2 za Unga (KES 120)",
            ),
            "cust_2": DeniEntry(
                customer_id="cust_2",
                customer_name="Baba Kibet",
                avatar_url="/mascots/baba_kibet.svg",
                current_balance_kes=250,
                credit_limit_kes=250,
                trust_score=3,
                last_transaction="Sabuni na Maziwa (KES 150)",
            ),
            "cust_3": DeniEntry(
                customer_id="cust_3",
                customer_name="Mzee Juma",
                avatar_url="/mascots/mzee_juma.svg",
                current_balance_kes=0,
                credit_limit_kes=500,
                trust_score=5,
                last_transaction="Imelipwa yote (KES 0)",
            ),
        }

    def get_all_entries(self) -> list[DeniEntry]:
        return list(self._entries.values())

    def calculate_new_balance(self, customer_id: str, new_purchase_kes: int) -> dict:
        entry = self._entries.get(customer_id)
        if not entry:
            return {"success": False, "error": "Customer not found"}

        projected_balance = entry.current_balance_kes + new_purchase_kes
        exceeds_limit = projected_balance > entry.credit_limit_kes

        return {
            "success": True,
            "customer_name": entry.customer_name,
            "previous_balance": entry.current_balance_kes,
            "new_purchase": new_purchase_kes,
            "projected_balance": projected_balance,
            "credit_limit": entry.credit_limit_kes,
            "exceeds_limit": exceeds_limit,
            "trust_score": entry.trust_score,
            "recommendation": (
                "Kukataa deni kwa heshima - imevuka kipimo"
                if exceeds_limit
                else "Kukubali deni - ana heshima mzuri"
            ),
        }

    def record_repayment(self, customer_id: str, payment_amount_kes: int) -> DeniEntry:
        entry = self._entries.get(customer_id)
        if not entry:
            raise ValueError("Customer not found")
        entry.current_balance_kes = max(0, entry.current_balance_kes - payment_amount_kes)
        entry.last_transaction = f"Amelipa KES {payment_amount_kes}"
        return entry
