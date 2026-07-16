from types import SimpleNamespace

import pytest

from src.services.ai.providers.openai_provider import OpenAIProvider


class FakeResponses:
    async def create(self, **_: object) -> object:
        return SimpleNamespace(output_text='{"status":"ok"}')


class FakeOpenAIClient:
    responses = FakeResponses()


@pytest.mark.asyncio
async def test_openai_provider_returns_output_text() -> None:
    provider = OpenAIProvider(api_key="test", client=FakeOpenAIClient())

    result = await provider.complete(
        system_prompt="Return JSON.",
        user_prompt="{}",
        model="gpt-5.6",
        temperature=0.2,
        max_output_tokens=100,
    )

    assert result == '{"status":"ok"}'
