import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.models import user, event, team          # noqa: F401
from app.models import document, payment          # noqa: F401
from app.models import notification               # noqa: F401 — registers all tables
from app.routes.auth import router as auth_router
from app.routes.events import router as events_router
from app.routes.teams import router as teams_router
from app.routes.documents import router as documents_router
from app.routes.payments import router as payments_router
from app.routes.admin import router as admin_router
from app.routes.notifications import router as notifications_router

Base.metadata.create_all(bind=engine)
os.makedirs("uploads", exist_ok=True)

app = FastAPI(title="XSPEED API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(events_router)
app.include_router(teams_router)
app.include_router(documents_router)
app.include_router(payments_router)
app.include_router(admin_router)
app.include_router(notifications_router)


@app.get("/")
def home():
    return {"message": "XSPEED API Running"}
