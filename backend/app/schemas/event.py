from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class EventOut(BaseModel):
    id: int
    slug: str
    display_name: str
    registration_fee: float
    per_member_fee: float
    max_members: int
    gst_percentage: float
    event_date: Optional[str]
    venue: Optional[str]
    is_active: bool
    registration_open: bool

    model_config = {"from_attributes": True}


class EventCreate(BaseModel):
    slug: str
    display_name: str
    registration_fee: float
    per_member_fee: float
    max_members: int
    gst_percentage: float
    event_date: Optional[str] = None
    venue: Optional[str] = None
    is_active: bool = True
    registration_open: bool = True


class EventUpdate(BaseModel):
    display_name: Optional[str] = None
    registration_fee: Optional[float] = None
    per_member_fee: Optional[float] = None
    max_members: Optional[int] = None
    gst_percentage: Optional[float] = None
    event_date: Optional[str] = None
    venue: Optional[str] = None
    is_active: Optional[bool] = None
    registration_open: Optional[bool] = None
