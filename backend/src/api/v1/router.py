from fastapi import APIRouter

from src.contracts.errors import ErrorResponse

from .gameplay import router as gameplay_router
from .health import router as health_router

api_router = APIRouter(
    responses={
        400: {"model": ErrorResponse, "description": "Invalid request."},
        404: {"model": ErrorResponse, "description": "Resource not found."},
        409: {"model": ErrorResponse, "description": "Request conflicts with game state."},
        422: {"model": ErrorResponse, "description": "Request validation failed."},
        500: {"model": ErrorResponse, "description": "Unexpected server error."},
    }
)
api_router.include_router(health_router)
api_router.include_router(gameplay_router)
