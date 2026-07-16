from src.agents.base.agent import StructuredAgent
from src.agents.shared.outputs import InsightAgentOutput


class InsightAgent(StructuredAgent[InsightAgentOutput]):
    prompt_name = "insights"
    output_model = InsightAgentOutput
