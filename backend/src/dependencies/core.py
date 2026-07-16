from typing import Annotated

from fastapi import Depends, Request

from src.core.config import Settings, get_settings
from src.services.ai.orchestrator import AIOrchestrator

SettingsDependency = Annotated[Settings, Depends(get_settings)]


def get_ai_orchestrator(request: Request) -> AIOrchestrator | None:
    return request.app.state.ai_orchestrator


AIOrchestratorDependency = Annotated[AIOrchestrator | None, Depends(get_ai_orchestrator)]
