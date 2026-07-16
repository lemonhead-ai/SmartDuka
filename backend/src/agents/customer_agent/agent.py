from src.agents.base.agent import StructuredAgent
from src.agents.shared.outputs import CustomerAgentOutput


class CustomerAgent(StructuredAgent[CustomerAgentOutput]):
    prompt_name = "customer"
    output_model = CustomerAgentOutput
