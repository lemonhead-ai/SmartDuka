from pathlib import Path

import pytest
from httpx import ASGITransport, AsyncClient

from src.core.config import Settings
from src.main import create_application
from src.services.ai.providers.base import LLMProvider
from src.services.ai.runtime import create_ai_orchestrator


class StubProvider(LLMProvider):
    async def complete(
        self,
        *,
        system_prompt: str,
        user_prompt: str,
        model: str,
        temperature: float,
        max_output_tokens: int,
    ) -> str:
        return "{}"


def test_featherless_runtime_builds_all_agents_with_configured_model() -> None:
    settings = Settings(
        llm_provider="featherless",
        featherless_api_key="test-key",
        featherless_model="glm-5.2",
    )

    orchestrator = create_ai_orchestrator(settings, provider=StubProvider())

    assert orchestrator.agents.customer.model == "glm-5.2"
    assert orchestrator.agents.tutor.model == "glm-5.2"
    assert not hasattr(orchestrator.agents, "mission")


@pytest.mark.asyncio
async def test_application_creates_featherless_orchestrator_at_startup(tmp_path: Path) -> None:
    database_path = tmp_path / "runtime.db"
    app = create_application(
        Settings(
            database_url=f"sqlite+aiosqlite:///{database_path.as_posix()}",
            llm_provider="featherless",
            featherless_api_key="test-key",
            featherless_model="glm-5.2",
        )
    )

    async with app.router.lifespan_context(app):
        assert app.state.ai_orchestrator is not None
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.post("/api/v1/gameplay/sessions")
            assert response.status_code == 201
