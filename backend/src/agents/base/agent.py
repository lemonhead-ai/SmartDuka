import json
import logging

from pydantic import BaseModel, ValidationError

from src.agents.base.prompt_loader import PromptLoader
from src.agents.shared.context import AgentContext
from src.services.ai.providers.base import LLMProvider


class StructuredAgent[OutputModel: BaseModel]:
    prompt_name: str
    output_model: type[OutputModel]

    def __init__(
        self,
        provider: LLMProvider,
        prompt_loader: PromptLoader,
        model: str,
        temperature: float = 0.2,
        max_output_tokens: int = 1_000,
    ) -> None:
        self.provider = provider
        self.prompt_loader = prompt_loader
        self.model = model
        self.temperature = temperature
        self.max_output_tokens = max_output_tokens
        self.logger = logging.getLogger(f"smartduka.agents.{self.prompt_name}")

    async def run(self, context: AgentContext) -> OutputModel:
        prompt = self.prompt_loader.load(self.prompt_name)
        schema_json = json.dumps(self.output_model.model_json_schema(), indent=2)
        system_prompt = f"{prompt.content}\n\nYou must respond ONLY with a valid JSON object matching this JSON schema:\n{schema_json}"

        raw_output = await self.provider.complete(
            system_prompt=system_prompt,
            user_prompt=context.model_dump_json(),
            model=self.model,
            temperature=self.temperature,
            max_output_tokens=self.max_output_tokens,
        )
        try:
            cleaned_output = raw_output.strip()
            if cleaned_output.startswith("```"):
                first_newline = cleaned_output.find("\n")
                if first_newline != -1:
                    cleaned_output = cleaned_output[first_newline + 1 :]
                last_backticks = cleaned_output.rfind("```")
                if last_backticks != -1:
                    cleaned_output = cleaned_output[:last_backticks]
            cleaned_output = cleaned_output.strip()

            return self.output_model.model_validate_json(cleaned_output)
        except ValidationError as error:
            self.logger.warning("Invalid agent output: %s", raw_output)
            raise ValueError(f"{self.prompt_name} returned invalid structured output") from error
