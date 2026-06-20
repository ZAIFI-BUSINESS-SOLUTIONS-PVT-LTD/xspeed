from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


class TeamMemberIn(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    date_of_birth: Optional[str] = None


class TeamMemberUpdate(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    date_of_birth: Optional[str] = None


class TeamCreate(BaseModel):
    event_slug: str
    team_name: str
    institution: str
    city: str
    state: str
    members: List[TeamMemberIn]


class TeamUpdate(BaseModel):
    team_name: Optional[str] = None
    institution: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    members: Optional[List[TeamMemberUpdate]] = None


class TeamMemberOut(BaseModel):
    id: int
    name: str
    email: str
    phone: Optional[str]
    date_of_birth: Optional[str]

    model_config = {"from_attributes": True}


class TeamOut(BaseModel):
    id: int
    registration_id: str
    event_slug: str
    team_name: str
    institution: str
    city: str
    state: str
    status: str
    created_at: datetime
    members: List[TeamMemberOut]

    model_config = {"from_attributes": True}
