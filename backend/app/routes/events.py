from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.event import Event
from app.schemas.event import EventOut, EventCreate, EventUpdate
from app.dependencies import require_role

router = APIRouter(
    prefix="/api/events",
    tags=["Events"]
)


@router.get("", response_model=List[EventOut])
def list_events(db: Session = Depends(get_db)):
    """Public — returns all active events."""
    return db.query(Event).filter(Event.is_active == True).all()


@router.get("/{slug}", response_model=EventOut)
def get_event(slug: str, db: Session = Depends(get_db)):
    """Public — returns a single active event by slug."""
    event = db.query(Event).filter(Event.slug == slug, Event.is_active == True).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event


@router.get("/{slug}/estimate")
def estimate_fee(slug: str, members: int = 1, db: Session = Depends(get_db)):
    """Public — calculates total fee for a given event and member count."""
    event = db.query(Event).filter(Event.slug == slug, Event.is_active == True).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    if members < 1 or members > event.max_members:
        raise HTTPException(
            status_code=400,
            detail=f"Member count must be between 1 and {event.max_members}",
        )

    base = float(event.registration_fee)
    per_member_total = float(event.per_member_fee) * members
    subtotal = base + per_member_total
    gst_amount = subtotal * (float(event.gst_percentage) / 100)
    grand_total = subtotal + gst_amount

    return {
        "event_slug": slug,
        "event_name": event.display_name,
        "member_count": members,
        "max_members": event.max_members,
        "registration_fee": base,
        "per_member_fee": float(event.per_member_fee),
        "per_member_total": per_member_total,
        "subtotal": round(subtotal, 2),
        "gst_percentage": float(event.gst_percentage),
        "gst_amount": round(gst_amount, 2),
        "grand_total": round(grand_total, 2),
    }


@router.post("", response_model=EventOut)
def create_event(
    data: EventCreate,
    db: Session = Depends(get_db),
    _: object = Depends(require_role("admin", "super_admin")),
):
    if db.query(Event).filter(Event.slug == data.slug).first():
        raise HTTPException(status_code=400, detail="Event slug already exists")

    event = Event(**data.model_dump())
    db.add(event)
    db.commit()
    db.refresh(event)
    return event


@router.put("/{slug}", response_model=EventOut)
def update_event(
    slug: str,
    data: EventUpdate,
    db: Session = Depends(get_db),
    _: object = Depends(require_role("admin", "super_admin")),
):
    event = db.query(Event).filter(Event.slug == slug).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    for field, value in data.model_dump(exclude_none=True).items():
        setattr(event, field, value)

    db.commit()
    db.refresh(event)
    return event
