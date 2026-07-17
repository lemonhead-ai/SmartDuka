import asyncio
import json
from datetime import UTC, datetime
from types import SimpleNamespace
from uuid import uuid4

from src.agents.difficulty_agent.agent import DifficultyAgent
from src.agents.insight_agent.agent import InsightAgent
from src.agents.localization_agent.agent import LocalizationAgent
from src.agents.reward_agent.agent import RewardAgent

from src.agents.base.prompt_loader import PromptLoader
from src.agents.customer_agent.agent import CustomerAgent
from src.agents.mission_agent.agent import MissionAgent
from src.agents.shared.context import (
    AgentContext,
    GameplaySessionContext,
    LearnerProfile,
    MissionContext,
    ProgressContext,
)
from src.agents.tutor_agent.agent import TutorAgent
from src.services.ai.orchestrator import AIOrchestrator


class StubProvider:
    responses = {
        "Customer Agent": {
            "customer_name": "Mama Akinyi",
            "dialogue": "Habari!",
            "shopping_request": "Naomba chai moja ya KES 20.",
            "item_count": 1,
            "mood": "friendly",
        },
        "Tutor Agent": {
            "hint": "Hesabu pesa uliyopewa halafu toa bei.",
            "focus_skill": "change",
            "encouragement": "Unaweza kufanya hivi!",
            "reveal_answer": False,
        },
        "Difficulty Agent": {
            "recommended_tier": 2,
            "adjustment": "stay",
            "rationale": "The learner is practising change.",
        },
        "Mission Agent": {
            "title": "Chai ya asubuhi",
            "briefing": "Msaidie Mama Wanjiku kuhudumia wateja watatu.",
            "goal_description": "Serve 3 customers",
            "target_value": 3,
        },
        "Reward Agent": {
            "reward_type": "duka_coins",
            "amount": 10,
            "reason": "You kept trying.",
            "celebration_message": "Hongera!",
        },
        "Insight Agent": {
            "summary": "Amina is practising change.",
            "recommended_action": "Practise change with small amounts.",
            "strength": "She keeps trying.",
        },
        "Localization Agent": {
            "localized_text": "Karibu dukani!",
            "culturally_valid": True,
            "language": "sw",
        },
    }

    async def complete(self, *, system_prompt: str, **_: object) -> str:
        response = next(
            response for name, response in self.responses.items() if name in system_prompt
        )
        return json.dumps(response)


async def main() -> None:
    provider = StubProvider()
    prompt_loader = PromptLoader()
    agents = SimpleNamespace(
        customer=CustomerAgent(provider, prompt_loader, "gpt-5.6"),
        tutor=TutorAgent(provider, prompt_loader, "gpt-5.6"),
        difficulty=DifficultyAgent(provider, prompt_loader, "gpt-5.6"),
        mission=MissionAgent(provider, prompt_loader, "gpt-5.6"),
        reward=RewardAgent(provider, prompt_loader, "gpt-5.6"),
        insight=InsightAgent(provider, prompt_loader, "gpt-5.6"),
        localization=LocalizationAgent(provider, prompt_loader, "gpt-5.6"),
    )
    context = AgentContext(
        learner=LearnerProfile(student_id=uuid4(), age=9, difficulty_tier=2),
        session=GameplaySessionContext(
            session_id=uuid4(),
            started_at=datetime.now(UTC),
            transactions_completed=2,
            last_skill="change",
            last_answer_was_correct=False,
        ),
        progress=ProgressContext(
            attempts=5,
            correct_attempts=3,
            weak_skills=["change"],
            consecutive_same_skill_mistakes=3,
        ),
        mission=MissionContext(),
    )
    result = await AIOrchestrator(agents).run_session_workflow(context)
    print(result.model_dump_json(indent=2))


if __name__ == "__main__":
    asyncio.run(main())
