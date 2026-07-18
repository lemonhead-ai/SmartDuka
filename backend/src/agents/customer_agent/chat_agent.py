from src.agents.base.agent import StructuredAgent
from src.agents.shared.outputs import CustomerChatOutput


class CustomerChatAgent(StructuredAgent[CustomerChatOutput]):
    prompt_name = "customer_chat"
    output_model = CustomerChatOutput
