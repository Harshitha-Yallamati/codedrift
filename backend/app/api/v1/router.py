from fastapi import APIRouter

from app.api.v1.routes import analytics, auth, dashboard, export, files, prs, repos, settings, trends, webhooks

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(repos.router)
api_router.include_router(dashboard.router)
api_router.include_router(files.router)
api_router.include_router(trends.router)
api_router.include_router(analytics.router)
api_router.include_router(prs.router)
api_router.include_router(export.router)
api_router.include_router(webhooks.router)
api_router.include_router(settings.router)
