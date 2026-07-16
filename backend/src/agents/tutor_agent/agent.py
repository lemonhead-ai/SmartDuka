from src.agents.base.agent import StructuredAgent
from src.agents.shared.outputs import TutorAgentOutput


class TutorAgent(StructuredAgent[TutorAgentOutput]):
    prompt_name = "tutor"
    output_model = TutorAgentOutput
