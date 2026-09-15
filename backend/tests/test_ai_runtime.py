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


def test_gemini_runtime_builds_all_agents_with_configured_model() -> None:
    settings = Settings(
        llm_provider="gemini",
        gemini_api_key="test-key",
        gemini_model="gemini-2.5-flash",
    )

    orchestrator = create_ai_orchestrator(settings, provider=StubProvider())

    assert orchestrator.agents.customer.model == "gemini-2.5-flash"
    assert orchestrator.agents.tutor.model == "gemini-2.5-flash"


def test_ollama_runtime_builds_all_agents_with_configured_model() -> None:
    settings = Settings(
        llm_provider="ollama",
        ollama_model="llama3.2",
    )

    orchestrator = create_ai_orchestrator(settings, provider=StubProvider())

    assert orchestrator.agents.customer.model == "llama3.2"
    assert orchestrator.agents.tutor.model == "llama3.2"


def test_groq_runtime_builds_all_agents_with_configured_model() -> None:
    settings = Settings(
        llm_provider="groq",
        groq_api_key="gsk_test",
        groq_model="llama-3.3-70b-versatile",
    )

    orchestrator = create_ai_orchestrator(settings, provider=StubProvider())

    assert orchestrator.agents.customer.model == "llama-3.3-70b-versatile"
    assert orchestrator.agents.tutor.model == "llama-3.3-70b-versatile"


def test_openrouter_runtime_builds_all_agents_with_configured_model() -> None:
    settings = Settings(
        llm_provider="openrouter",
        openrouter_api_key="sk-or-test",
        openrouter_model="meta-llama/llama-3.2-3b-instruct:free",
    )

    orchestrator = create_ai_orchestrator(settings, provider=StubProvider())

    assert orchestrator.agents.customer.model == "meta-llama/llama-3.2-3b-instruct:free"
    assert orchestrator.agents.tutor.model == "meta-llama/llama-3.2-3b-instruct:free"


class FailingProvider(LLMProvider):
    async def complete(
        self,
        *,
        system_prompt: str,
        user_prompt: str,
        model: str,
        temperature: float,
        max_output_tokens: int,
    ) -> str:
        raise RuntimeError("Featherless subscription expired or API key invalid")


@pytest.mark.asyncio
async def test_fallback_provider_uses_gemini_when_primary_fails() -> None:
    from src.services.ai.providers import FallbackProvider

    primary = FailingProvider()
    fallback = StubProvider()
    provider = FallbackProvider(
        primary_provider=primary,
        primary_model="Qwen/Qwen3-32B",
        fallback_provider=fallback,
        fallback_model="gemini-2.5-flash",
    )

    res = await provider.complete(
        system_prompt="sys",
        user_prompt="user",
        model="Qwen/Qwen3-32B",
        temperature=0.1,
        max_output_tokens=100,
    )

    assert res == "{}"


@pytest.mark.asyncio
async def test_factory_creates_fallback_provider_when_both_keys_present() -> None:
    from src.services.ai.factory import create_llm_provider
    from src.services.ai.providers import FallbackProvider

    settings = Settings(
        llm_provider="featherless",
        featherless_api_key="featherless-key",
        gemini_api_key="gemini-key",
    )
    provider = create_llm_provider(settings)
    assert isinstance(provider, FallbackProvider)


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


@pytest.mark.asyncio
async def test_application_creates_ollama_orchestrator_at_startup(tmp_path: Path) -> None:
    database_path = tmp_path / "ollama_runtime.db"
    app = create_application(
        Settings(
            database_url=f"sqlite+aiosqlite:///{database_path.as_posix()}",
            llm_provider="ollama",
            ollama_model="llama3.2",
        )
    )

    async with app.router.lifespan_context(app):
        assert app.state.ai_orchestrator is not None
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.post("/api/v1/gameplay/sessions")
            assert response.status_code == 201

