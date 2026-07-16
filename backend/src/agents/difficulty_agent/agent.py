from src.agents.base.agent import StructuredAgent
from src.agents.shared.context import AgentContext
from src.agents.shared.outputs import DifficultyAgentOutput


class DifficultyAgent(StructuredAgent[DifficultyAgentOutput]):
    prompt_name = "difficulty"
    output_model = DifficultyAgentOutput

    async def run(self, context: AgentContext) -> DifficultyAgentOutput:
        output = await super().run(context)
        if abs(output.recommended_tier - context.learner.difficulty_tier) > 1:
            raise ValueError("Difficulty changes must move by one tier at most.")
        return output
