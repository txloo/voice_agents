from app.api.agents import router as agents_router
from app.api.auth import router as auth_router
from app.api.calls import router as calls_router
from app.api.webhooks import router as webhooks_router

__all__ = [
    "agents_router",
    "auth_router",
    "calls_router",
    "webhooks_router",
]
