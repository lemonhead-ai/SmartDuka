from src.agents.base.agent import StructuredAgent
from src.agents.shared.outputs import MissionAgentOutput


class MissionAgent(StructuredAgent[MissionAgentOutput]):
    prompt_name = "missions"
    output_model = MissionAgentOutput
