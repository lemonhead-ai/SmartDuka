from pathlib import Path

import pytest
from httpx import ASGITransport, AsyncClient

from src.core.config import Settings
from src.main import create_application


@pytest.mark.asyncio
async def test_shopkeeper_can_register_read_session_and_sign_out(tmp_path: Path) -> None:
    app = create_application(
        Settings(database_url=f"sqlite+aiosqlite:///{(tmp_path / 'auth.db').as_posix()}")
    )

    async with app.router.lifespan_context(app):
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            registered = await client.post(
                "/api/v1/auth/sign-up",
                json={
                    "email": "owner@example.com",
                    "display_name": "Amina",
                    "password": "a-strong-password",
                },
            )
            assert registered.status_code == 201
            assert "smartduka_session" in registered.headers["set-cookie"]
            assert registered.json()["shopkeeper"]["email"] == "owner@example.com"

            current = await client.get("/api/v1/auth/me")
            assert current.status_code == 200
            assert current.json()["shopkeeper"]["display_name"] == "Amina"

            signed_out = await client.post("/api/v1/auth/sign-out")
            assert signed_out.status_code == 200
            assert (await client.get("/api/v1/auth/me")).status_code == 401


@pytest.mark.asyncio
async def test_sign_in_rejects_invalid_credentials_and_duplicate_email(tmp_path: Path) -> None:
    app = create_application(
        Settings(database_url=f"sqlite+aiosqlite:///{(tmp_path / 'auth-validation.db').as_posix()}")
    )
    payload = {
        "email": "owner@example.com",
        "display_name": "Amina",
        "password": "a-strong-password",
    }

    async with app.router.lifespan_context(app):
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            assert (await client.post("/api/v1/auth/sign-up", json=payload)).status_code == 201
            assert (await client.post("/api/v1/auth/sign-up", json=payload)).status_code == 409
            invalid = await client.post(
                "/api/v1/auth/sign-in",
                json={"email": payload["email"], "password": "not-the-password"},
            )
            assert invalid.status_code == 401


@pytest.mark.asyncio
async def test_authenticated_shopkeeper_can_create_and_read_only_their_duka(tmp_path: Path) -> None:
    app = create_application(
        Settings(database_url=f"sqlite+aiosqlite:///{(tmp_path / 'shop-owner.db').as_posix()}")
    )

    async with app.router.lifespan_context(app):
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            sign_up = await client.post(
                "/api/v1/auth/sign-up",
                json={
                    "email": "owner@example.com",
                    "display_name": "Amina",
                    "password": "a-strong-password",
                },
            )
            assert sign_up.status_code == 201
            assert (await client.get("/api/v1/shop")).status_code == 404

            catalog = await client.get("/api/v1/shop/catalog")
            item_ids = [item["id"] for item in catalog.json() if item["category"] == "fruits"][:2]
            created = await client.post(
                "/api/v1/shop",
                json={"name": "Amina's Duka", "category": "fruits", "item_ids": item_ids},
            )
            assert created.status_code == 201
            assert created.json()["name"] == "Amina's Duka"
            assert (await client.get("/api/v1/shop")).json()["id"] == created.json()["id"]
