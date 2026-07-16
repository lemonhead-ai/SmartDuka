from dataclasses import dataclass

from src.agents.base.prompt_loader import PromptLoader
from src.agents.customer_agent import CustomerAgent
from src.agents.difficulty_agent import DifficultyAgent
from src.agents.insight_agent import InsightAgent
from src.agents.localization_agent import LocalizationAgent
from src.agents.mission_agent import MissionAgent
from src.agents.reward_agent import RewardAgent
from src.agents.tutor_agent import TutorAgent
from src.core.config import Settings
from src.services.ai.factory import create_llm_provider
from src.services.ai.orchestrator import AIOrchestrator
from src.services.ai.providers import LLMProvider


@dataclass(frozen=True)
class AgentBundle:
    customer: CustomerAgent
    tutor: TutorAgent
    difficulty: DifficultyAgent
    mission: MissionAgent
    reward: RewardAgent
    insight: InsightAgent
    localization: LocalizationAgent


def create_ai_orchestrator(
    settings: Settings, provider: LLMProvider | None = None
) -> AIOrchestrator:
    configured_provider = provider or create_llm_provider(settings)
    model = (
        settings.featherless_model
        if settings.llm_provider == "featherless"
        else settings.openai_model
    )
    prompt_loader = PromptLoader()
    agent_kwargs = {
        "provider": configured_provider,
        "prompt_loader": prompt_loader,
        "model": model,
    }
    return AIOrchestrator(
        AgentBundle(
            customer=CustomerAgent(**agent_kwargs),
            tutor=TutorAgent(**agent_kwargs),
            difficulty=DifficultyAgent(**agent_kwargs),
            mission=MissionAgent(**agent_kwargs),
            reward=RewardAgent(**agent_kwargs),
            insight=InsightAgent(**agent_kwargs),
            localization=LocalizationAgent(**agent_kwargs),
        )
    )
