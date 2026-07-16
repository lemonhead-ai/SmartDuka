from src.agents.base.agent import StructuredAgent
from src.agents.shared.outputs import LocalizationAgentOutput


class LocalizationAgent(StructuredAgent[LocalizationAgentOutput]):
    prompt_name = "localization"
    output_model = LocalizationAgentOutput
