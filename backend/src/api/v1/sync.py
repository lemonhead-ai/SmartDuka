from fastapi import APIRouter

from src.contracts.sync import SyncUploadRequest, SyncUploadResponse
from src.dependencies.core import AIOrchestratorDependency
from src.dependencies.database import DatabaseSession
from src.services.sync.service import SyncService

router = APIRouter(prefix="/sync", tags=["sync"])


@router.post("/upload", response_model=SyncUploadResponse, response_model_by_alias=True)
async def upload_offline_events(
    payload: SyncUploadRequest,
    db: DatabaseSession,
    orchestrator: AIOrchestratorDependency,
) -> SyncUploadResponse:
    return await SyncService(db, orchestrator).upload(payload)
