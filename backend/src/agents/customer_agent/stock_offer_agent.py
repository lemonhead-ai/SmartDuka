from src.agents.base.agent import StructuredAgent
from src.agents.shared.outputs import StockOfferDecisionOutput


class StockOfferAgent(StructuredAgent[StockOfferDecisionOutput]):
    prompt_name = "customer_stock_offer"
    output_model = StockOfferDecisionOutput
