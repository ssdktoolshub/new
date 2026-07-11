from fastapi import APIRouter
from app.api.v1.endpoints import auth, medical, ai, tools, categories, admin

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(medical.router, prefix="/medical", tags=["medical_hub"])
api_router.include_router(ai.router, prefix="/ai", tags=["ai_services"])
api_router.include_router(tools.router, prefix="/tools", tags=["tools_registry"])
api_router.include_router(categories.router, prefix="/categories", tags=["categories_registry"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin_cms"])
