from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime
from datetime import datetime

from app.database import Base


class Event(Base):

    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)

    # Machine-readable identifier: "go_kart" | "formula_green"
    slug = Column(String, unique=True, index=True, nullable=False)

    display_name = Column(String, nullable=False)  # "Go-Kart Racing"

    registration_fee = Column(Float, nullable=False, default=0.0)
    per_member_fee = Column(Float, nullable=False, default=0.0)
    max_members = Column(Integer, nullable=False, default=5)
    gst_percentage = Column(Float, nullable=False, default=18.0)

    event_date = Column(String, nullable=True)   # NEEDS_CLIENT_CONFIRMATION
    venue = Column(String, nullable=True)        # NEEDS_CLIENT_CONFIRMATION

    is_active = Column(Boolean, default=True, nullable=False)
    registration_open = Column(Boolean, default=True, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
