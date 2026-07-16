from src.agents.base.agent import StructuredAgent
from src.agents.shared.outputs import DifficultyAgentOutput


class DifficultyAgent(StructuredAgent[DifficultyAgentOutput]):
    prompt_name = "difficulty"
    output_model = DifficultyAgentOutput
