from fastapi import APIRouter
from .endpoints.generate import router as generate_router
from .endpoints.reflect import router as reflect_router

api_router = APIRouter()
api_router.include_router(generate_router)
api_router.include_router(reflect_router)
