from types import SimpleNamespace

import pytest

from src.services.ai.providers.openai_provider import OpenAIProvider


class FakeResponses:
    async def create(self, **_: object) -> object:
        return SimpleNamespace(output_text='{"status":"ok"}')


class FakeOpenAIClient:
    responses = FakeResponses()


class FakeChatCompletions:
    def __init__(self) -> None:
        self.arguments: dict[str, object] | None = None

    async def create(self, **kwargs: object) -> object:
        self.arguments = kwargs
        return SimpleNamespace(
            choices=[SimpleNamespace(message=SimpleNamespace(content='{"status":"ok"}'))]
        )


class FakeFeatherlessClient:
    chat = SimpleNamespace(completions=FakeChatCompletions())


@pytest.mark.asyncio
async def test_openai_provider_returns_output_text() -> None:
    provider = OpenAIProvider(api_key="test", client=FakeOpenAIClient())

    result = await provider.complete(
        system_prompt="Return JSON.",
        user_prompt="{}",
        model="Qwen/Qwen3-32B",
        temperature=0.2,
        max_output_tokens=100,
    )

    assert result == '{"status":"ok"}'


@pytest.mark.asyncio
async def test_featherless_provider_uses_chat_completions() -> None:
    completions = FakeChatCompletions()
    provider = OpenAIProvider(
        api_key="test",
        client=SimpleNamespace(chat=SimpleNamespace(completions=completions)),
        use_responses_api=False,
        chat_template_kwargs={"enable_thinking": False},
    )

    result = await provider.complete(
        system_prompt="Return JSON.",
        user_prompt="{}",
        model="glm-5.2",
        temperature=0.2,
        max_output_tokens=100,
    )

    assert result == '{"status":"ok"}'
    assert completions.arguments is not None
    assert completions.arguments["extra_body"] == {
        "chat_template_kwargs": {"enable_thinking": False}
    }
