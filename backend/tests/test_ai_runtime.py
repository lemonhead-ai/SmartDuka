import asyncio
from pathlib import Path
from types import SimpleNamespace

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


@pytest.mark.asyncio
async def test_orchestrator_enforces_a_short_ai_deadline() -> None:
    from src.services.ai.orchestrator import AIOrchestrator

    async def never_finishes() -> None:
        await asyncio.sleep(1)

    orchestrator = AIOrchestrator(agents=object(), request_timeout_seconds=0.01)
    with pytest.raises(TimeoutError):
        await orchestrator._within_deadline(never_finishes())


class ReadyProvider(LLMProvider):
    async def complete(
        self,
        *,
        system_prompt: str,
        user_prompt: str,
        model: str,
        temperature: float,
        max_output_tokens: int,
    ) -> str:
        assert "readiness" in user_prompt
        assert max_output_tokens == 20
        return '{"status":"ready"}'


@pytest.mark.asyncio
async def test_orchestrator_cloud_readiness_requires_valid_json() -> None:
    from src.services.ai.orchestrator import AIOrchestrator

    agents = SimpleNamespace(
        customer=SimpleNamespace(provider=ReadyProvider(), model="llama-3.3-70b-versatile")
    )
    await AIOrchestrator(agents, request_timeout_seconds=0.1).cloud_readiness()


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


def test_groq_uses_openrouter_as_its_cloud_fallback() -> None:
    from src.services.ai.factory import create_llm_provider
    from src.services.ai.providers import FallbackProvider

    provider = create_llm_provider(
        Settings(
            llm_provider="groq",
            groq_api_key="gsk_test",
            openrouter_api_key="sk-or-test",
        )
    )

    assert isinstance(provider, FallbackProvider)
    assert provider.primary_model == "llama-3.3-70b-versatile"
    assert provider.fallback_model == "meta-llama/llama-3.3-70b-instruct"


def test_openrouter_uses_groq_as_its_cloud_fallback() -> None:
    from src.services.ai.factory import create_llm_provider
    from src.services.ai.providers import FallbackProvider

    provider = create_llm_provider(
        Settings(
            llm_provider="openrouter",
            groq_api_key="gsk_test",
            openrouter_api_key="sk-or-test",
        )
    )

    assert isinstance(provider, FallbackProvider)
    assert provider.primary_model == "meta-llama/llama-3.3-70b-instruct"
    assert provider.fallback_model == "llama-3.3-70b-versatile"


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
