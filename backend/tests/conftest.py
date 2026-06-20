"""
Shared fixtures for all XSPEED test phases.
Uses SQLite file DB so tests never touch production PostgreSQL.
Tables are dropped and recreated at session start for a clean slate every run.
"""
import os

# ── MUST be set before any app import so app.config picks up SQLite ──────────
os.environ["DATABASE_URL"] = "sqlite:///./test_xspeed.db"

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event as sqla_event
from sqlalchemy.orm import sessionmaker

from app.database import Base, get_db
from app.main import app
from app.models.user import User
from app.models.event import Event
from app.auth.security import hash_password

# ── Test engine ───────────────────────────────────────────────────────────────
_TEST_ENGINE = create_engine(
    "sqlite:///./test_xspeed.db",
    connect_args={"check_same_thread": False},
)

@sqla_event.listens_for(_TEST_ENGINE, "connect")
def _enable_fk(dbapi_conn, _):
    dbapi_conn.cursor().execute("PRAGMA foreign_keys=ON")

_TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=_TEST_ENGINE)


def _override_get_db():
    db = _TestingSession()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = _override_get_db
os.makedirs("uploads", exist_ok=True)


# ── DB setup: always drop+create for a clean slate each pytest session ────────
@pytest.fixture(scope="session", autouse=True)
def _db():
    Base.metadata.drop_all(bind=_TEST_ENGINE)
    Base.metadata.create_all(bind=_TEST_ENGINE)
    yield


@pytest.fixture(scope="session")
def client(_db):
    with TestClient(app) as c:
        yield c


@pytest.fixture(scope="session")
def db_session(_db):
    db = _TestingSession()
    yield db
    db.close()


# ── Seed events (idempotent — skips if already present) ──────────────────────
@pytest.fixture(scope="session")
def seeded_event(db_session):
    for slug, name, reg_fee, per_fee, max_m in [
        ("go_kart",       "Go-Kart Racing",        2000.0, 500.0, 4),
        ("formula_green", "Formula Green Racing",   3000.0, 600.0, 8),
    ]:
        if not db_session.query(Event).filter_by(slug=slug).first():
            db_session.add(Event(
                slug=slug,
                display_name=name,
                registration_fee=reg_fee,
                per_member_fee=per_fee,
                max_members=max_m,
                gst_percentage=18.0,
                is_active=True,
                registration_open=True,
            ))
    db_session.commit()
    return db_session.query(Event).filter_by(slug="go_kart").first()


# ── Shared test users (idempotent) ────────────────────────────────────────────
@pytest.fixture(scope="session")
def admin_headers(client, db_session, seeded_event):
    if not db_session.query(User).filter_by(email="admin@xspeedtest.com").first():
        db_session.add(User(
            full_name="Admin User",
            email="admin@xspeedtest.com",
            phone="9000000001",
            hashed_password=hash_password("Admin@1234"),
            role="admin",
            is_active=True,
        ))
        db_session.commit()
    res = client.post("/api/auth/login", json={
        "email": "admin@xspeedtest.com", "password": "Admin@1234"
    })
    return {"Authorization": f"Bearer {res.json()['access_token']}"}


@pytest.fixture(scope="session")
def user_headers(client, seeded_event):
    res = client.post("/api/auth/register", json={
        "full_name": "Test Leader",
        "email": "leader@xspeedtest.com",
        "phone": "9100000001",
        "password": "Test@1234",
    })
    if res.status_code == 400:
        res = client.post("/api/auth/login", json={
            "email": "leader@xspeedtest.com", "password": "Test@1234"
        })
    return {"Authorization": f"Bearer {res.json()['access_token']}"}


@pytest.fixture(scope="session")
def registered_team(client, user_headers):
    """Ensure the shared test user has a go_kart team. Idempotent."""
    res = client.post("/api/teams", json={
        "team_name": "Thunder Wheels",
        "event_slug": "go_kart",
        "institution": "VIT University",
        "city": "Vellore",
        "state": "Tamil Nadu",
        "members": [{"name": "Test Leader", "email": "leader@xspeedtest.com"}],
    }, headers=user_headers)
    if res.status_code in (200, 201):
        return res.json()
    # Team already created (e.g. by test_1b running before this fixture)
    return client.get("/api/teams/mine?event_slug=go_kart", headers=user_headers).json()


# ── File helpers ──────────────────────────────────────────────────────────────
def make_pdf(name: str = "test.pdf"):
    return (name, b"%PDF-1.4 fake test content", "application/pdf")

def make_jpg(name: str = "test.jpg"):
    return (name, b"\xff\xd8\xff fake jpeg content", "image/jpeg")
