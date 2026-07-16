from openai import AsyncOpenAI


class OpenAIProvider:
    def __init__(self, api_key: str, client: AsyncOpenAI | None = None) -> None:
        self.client = client or AsyncOpenAI(api_key=api_key)

    async def complete(
        self,
        *,
        system_prompt: str,
        user_prompt: str,
        model: str,
        temperature: float,
        max_output_tokens: int,
    ) -> str:
        response = await self.client.responses.create(
            model=model,
            instructions=system_prompt,
            input=user_prompt,
            temperature=temperature,
            max_output_tokens=max_output_tokens,
        )
        if not response.output_text:
            raise RuntimeError("OpenAI returned no output text.")
        return response.output_text
