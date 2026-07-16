from pathlib import Path

import pytest
from httpx import ASGITransport, AsyncClient

from src.core.config import Settings
from src.main import create_application


@pytest.mark.asyncio
async def test_openapi_and_validation_errors_use_version_one_contract(tmp_path: Path) -> None:
    database_path = tmp_path / "demo.db"
    settings = Settings(
        database_url=f"sqlite+aiosqlite:///{database_path.as_posix()}",
        featherless_api_key=None,
    )
    app = create_application(settings)

    async with app.router.lifespan_context(app):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            openapi_response = await client.get("/api/v1/openapi.json")
            assert openapi_response.status_code == 200
            assert "/api/v1/gameplay/sessions" in openapi_response.json()["paths"]
            assert (
                "/api/v1/gameplay/sessions/{session_id}/question"
                not in openapi_response.json()["paths"]
            )

            validation_response = await client.post(
                "/api/v1/gameplay/sessions/not-a-uuid/basket/items", json={"quantity": 0}
            )
            assert validation_response.status_code == 422
            assert validation_response.json()["detail"] == "Request validation failed."
            assert validation_response.json()["errors"]
