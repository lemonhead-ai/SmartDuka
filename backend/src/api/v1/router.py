from fastapi import APIRouter

from .gameplay import router as gameplay_router
from .health import router as health_router

api_router = APIRouter()
api_router.include_router(health_router)
api_router.include_router(gameplay_router)
