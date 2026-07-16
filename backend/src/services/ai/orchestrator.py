from typing import Protocol
from uuid import UUID


class AIOrchestrator(Protocol):
    """Boundary for future agent orchestration; no implementation in Module 1."""

    async def refresh_child_content(self, child_id: UUID) -> None: ...
