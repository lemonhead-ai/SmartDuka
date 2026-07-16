from openai import AsyncOpenAI


class OpenAIProvider:
    def __init__(
        self,
        api_key: str,
        base_url: str | None = None,
        client: AsyncOpenAI | None = None,
        use_responses_api: bool = True,
    ) -> None:
        self.client = client or AsyncOpenAI(api_key=api_key, base_url=base_url)
        self.use_responses_api = use_responses_api

    async def complete(
        self,
        *,
        system_prompt: str,
        user_prompt: str,
        model: str,
        temperature: float,
        max_output_tokens: int,
    ) -> str:
        if self.use_responses_api:
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
        response = await self.client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=temperature,
            max_tokens=max_output_tokens,
        )
        content = response.choices[0].message.content
        if not content:
            raise RuntimeError("Featherless returned no output text.")
        return content
