import uuid
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base


class Team(Base):

    __tablename__ = "teams"

    id = Column(Integer, primary_key=True, index=True)
    registration_id = Column(String, unique=True, index=True, nullable=False)

    leader_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    event_slug = Column(String, ForeignKey("events.slug"), nullable=False)

    team_name = Column(String, nullable=False)
    institution = Column(String, nullable=False)
    city = Column(String, nullable=False)
    state = Column(String, nullable=False)

    # Registration status — see MASTER_TASK.md Core Statuses
    status = Column(String, default="submitted", nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    members = relationship("TeamMember", back_populates="team", cascade="all, delete-orphan")


class TeamMember(Base):

    __tablename__ = "team_members"

    id = Column(Integer, primary_key=True, index=True)
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=False)

    name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    date_of_birth = Column(String, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    team = relationship("Team", back_populates="members")
