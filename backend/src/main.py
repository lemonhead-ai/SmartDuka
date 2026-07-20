from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import RequestResponseEndpoint
from starlette.responses import Response

from src.api.v1.router import api_router
from src.core.config import Settings, get_settings
from src.core.exceptions import register_exception_handlers
from src.core.logging import configure_logging
from src.core.security import create_request_id
from src.database.session import Database
from src.seed.demo import seed_demo_data
from src.services.ai.runtime import create_ai_orchestrator


def create_application(settings: Settings | None = None) -> FastAPI:
    configured_settings = settings or get_settings()

    @asynccontextmanager
    async def lifespan(application: FastAPI) -> AsyncIterator[None]:
        configure_logging(configured_settings)
        database = Database(configured_settings.database_url)
        await database.create_schema()
        async with database.session_factory() as session:
            await seed_demo_data(session)
        application.state.database = database
        provider_is_configured = (
            configured_settings.llm_provider == "featherless"
            and configured_settings.featherless_api_key is not None
        ) or (
            configured_settings.llm_provider == "openai"
            and configured_settings.openai_api_key is not None
        )
        if provider_is_configured:
            application.state.ai_orchestrator = create_ai_orchestrator(configured_settings)
        else:
            application.state.ai_orchestrator = None
        try:
            yield
        finally:
            await database.dispose()

    application = FastAPI(
        title=configured_settings.app_name,
        version=configured_settings.app_version,
        description="Version 1 REST API for the Smart Duka learning game.",
        openapi_url=f"{configured_settings.api_v1_prefix}/openapi.json",
        docs_url="/docs",
        redoc_url="/redoc",
        debug=configured_settings.debug,
        lifespan=lifespan,
    )
    application.add_middleware(
        CORSMiddleware,
        allow_origins=configured_settings.allowed_origins,
        allow_origin_regex=r"https://.*\.vercel\.app",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @application.middleware("http")
    async def attach_request_id(request: Request, call_next: RequestResponseEndpoint) -> Response:
        request.state.request_id = create_request_id()
        return await call_next(request)

    application.include_router(api_router, prefix=configured_settings.api_v1_prefix)
    register_exception_handlers(application)
    return application


app = create_application()
