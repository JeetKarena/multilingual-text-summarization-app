# BackEnd/app/api/__init__.py
from fastapi import APIRouter
from app.api.endpoints import auth, documents, summarization

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(documents.router, prefix="/documents", tags=["documents"])
api_router.include_router(summarization.router, prefix="/summarize", tags=["summarization"])