import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.team import Team, TeamMember
from app.models.event import Event
from app.models.user import User
from app.schemas.team import TeamCreate, TeamOut, TeamUpdate
from app.dependencies import get_current_user
from app.utils.email import send_registration_email

router = APIRouter(prefix="/api/teams", tags=["Teams"])


def _generate_registration_id(event_slug: str) -> str:
    prefix = "GK" if event_slug == "go_kart" else "FG"
    year = datetime.now().strftime("%Y")
    uid = str(uuid.uuid4())[:6].upper()
    return f"XSP-{prefix}-{year}-{uid}"


@router.get("/public")
def get_public_teams(db: Session = Depends(get_db)):
    """Public list — no personal data exposed."""
    teams = (
        db.query(Team)
        .filter(Team.status.in_(["submitted", "payment_done", "approved"]))
        .order_by(Team.created_at.desc())
        .all()
    )
    return [
        {
            "team_name": t.team_name,
            "institution": t.institution,
            "city": t.city,
            "event_slug": t.event_slug,
            "status": t.status,
        }
        for t in teams
    ]


@router.post("", response_model=TeamOut)
def create_team(
    data: TeamCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    event = db.query(Event).filter(
        Event.slug == data.event_slug,
        Event.is_active == True,
    ).first()

    if not event:
        raise HTTPException(status_code=404, detail="Event not found or not currently active")

    if not event.registration_open:
        raise HTTPException(status_code=400, detail="Registration is closed for this event")

    existing = db.query(Team).filter(
        Team.leader_id == current_user.id,
        Team.event_slug == data.event_slug,
    ).first()

    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"You have already registered a team for this event. "
                   f"Your registration ID is {existing.registration_id}",
        )

    if len(data.members) < 1:
        raise HTTPException(status_code=400, detail="At least 1 team member is required")

    if len(data.members) > event.max_members:
        raise HTTPException(
            status_code=400,
            detail=f"Maximum {event.max_members} members allowed for {event.display_name}",
        )

    team = Team(
        registration_id=_generate_registration_id(data.event_slug),
        leader_id=current_user.id,
        event_slug=data.event_slug,
        team_name=data.team_name,
        institution=data.institution,
        city=data.city,
        state=data.state,
        status="submitted",
    )
    db.add(team)
    db.flush()

    for m in data.members:
        db.add(TeamMember(
            team_id=team.id,
            name=m.name,
            email=m.email,
            phone=m.phone or None,
            date_of_birth=m.date_of_birth or None,
        ))

    db.commit()
    db.refresh(team)

    send_registration_email(
        to_email=current_user.email,
        full_name=current_user.full_name,
        team_name=team.team_name,
        registration_id=team.registration_id,
        event_name=event.display_name,
    )

    return team


@router.get("/mine", response_model=TeamOut)
def get_my_team(
    event_slug: str = "",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Team).filter(Team.leader_id == current_user.id)
    if event_slug:
        query = query.filter(Team.event_slug == event_slug)
    team = query.order_by(Team.created_at.desc()).first()
    if not team:
        raise HTTPException(status_code=404, detail="No team registration found")
    return team


@router.put("/mine", response_model=TeamOut)
def update_my_team(
    data: TeamUpdate,
    event_slug: str = "",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Team).filter(Team.leader_id == current_user.id)
    if event_slug:
        query = query.filter(Team.event_slug == event_slug)
    team = query.order_by(Team.created_at.desc()).first()
    if not team:
        raise HTTPException(status_code=404, detail="No team registration found")

    LOCKED_STATUSES = {"payment_done", "approved", "rejected"}
    if team.status in LOCKED_STATUSES:
        raise HTTPException(
            status_code=400,
            detail="Team details cannot be changed after payment is completed",
        )

    if data.team_name is not None:
        team.team_name = data.team_name
    if data.institution is not None:
        team.institution = data.institution
    if data.city is not None:
        team.city = data.city
    if data.state is not None:
        team.state = data.state

    if data.members is not None:
        if len(data.members) < 1:
            raise HTTPException(status_code=400, detail="At least 1 team member is required")

        event = db.query(Event).filter(Event.slug == team.event_slug).first()
        if event and len(data.members) > event.max_members:
            raise HTTPException(
                status_code=400,
                detail=f"Maximum {event.max_members} members allowed",
            )

        # Replace member list entirely
        for m in team.members:
            db.delete(m)
        db.flush()

        for m in data.members:
            db.add(TeamMember(
                team_id=team.id,
                name=m.name,
                email=m.email,
                phone=m.phone or None,
                date_of_birth=m.date_of_birth or None,
            ))

    db.commit()
    db.refresh(team)
    return team
