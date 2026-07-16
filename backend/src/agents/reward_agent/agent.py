from src.agents.base.agent import StructuredAgent
from src.agents.shared.outputs import RewardAgentOutput


class RewardAgent(StructuredAgent[RewardAgentOutput]):
    prompt_name = "reward"
    output_model = RewardAgentOutput
