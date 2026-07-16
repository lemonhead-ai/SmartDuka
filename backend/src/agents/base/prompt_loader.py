from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class LoadedPrompt:
    name: str
    version: str
    content: str


class PromptLoader:
    def __init__(self, prompts_path: Path | None = None) -> None:
        self.prompts_path = prompts_path or Path(__file__).parents[2] / "prompts"

    def load(self, name: str) -> LoadedPrompt:
        prompt_path = self.prompts_path / f"{name}.md"
        content = prompt_path.read_text(encoding="utf-8").strip()
        if not content:
            raise ValueError(f"Prompt file is empty: {prompt_path}")
        first_line, _, _ = content.partition("\n")
        version = first_line.removeprefix("<!-- prompt-version: ").removesuffix(" -->")
        if version == first_line:
            raise ValueError(f"Prompt version header is missing: {prompt_path}")
        return LoadedPrompt(name=name, version=version, content=content)
