import csv
import io
import os
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import require_role
from app.models.document import Document, DOC_LABELS
from app.models.event import Event
from app.models.notification import Notification
from app.models.payment import Payment
from app.models.team import Team, TeamMember
from app.models.user import User
from app.utils.email import send_team_status_email, send_document_review_email, send_admin_message_email

router = APIRouter(prefix="/api/admin", tags=["Admin"])
_admin = Depends(require_role("admin", "super_admin"))


class TeamStatusIn(BaseModel):
    status: str   # under_review | approved | rejected | waitlisted | cancelled
    note: Optional[str] = None


class DocumentReviewIn(BaseModel):
    status: str   # approved | rejected | reupload_requested
    reviewer_note: Optional[str] = None


class AdminMessageIn(BaseModel):
    subject: str
    message: str


def _notify(db: Session, user_id: int, title: str, message: str, notif_type: str = "message") -> None:
    db.add(Notification(user_id=user_id, title=title, message=message, notif_type=notif_type))
    db.commit()


# ── Stats ────────────────────────────────────────────────────────────────────

@router.get("/stats")
def get_stats(db: Session = Depends(get_db), _=_admin):
    total = db.query(Team).count()

    by_event = {
        "go_kart": db.query(Team).filter(Team.event_slug == "go_kart").count(),
        "formula_green": db.query(Team).filter(Team.event_slug == "formula_green").count(),
    }

    by_status: dict[str, int] = {}
    for s in ["submitted", "payment_done", "under_review", "approved", "rejected", "waitlisted"]:
        by_status[s] = db.query(Team).filter(Team.status == s).count()

    docs_pending  = db.query(Document).filter(Document.status == "pending").count()
    docs_approved = db.query(Document).filter(Document.status == "approved").count()
    docs_rejected = db.query(Document).filter(Document.status == "rejected").count()

    paid_count  = db.query(Payment).filter(Payment.status == "paid").count()
    total_paise = (
        db.query(func.sum(Payment.amount_paise))
        .filter(Payment.status == "paid")
        .scalar()
        or 0
    )

    return {
        "total_teams": total,
        "by_event": by_event,
        "by_status": by_status,
        "documents": {
            "pending":  docs_pending,
            "approved": docs_approved,
            "rejected": docs_rejected,
        },
        "payments": {
            "paid_count": paid_count,
            "total_amount_inr": round(total_paise / 100, 2),
        },
    }


# ── Teams ────────────────────────────────────────────────────────────────────

@router.get("/teams/export")
def export_teams(
    event_slug: str = Query(default=""),
    status:     str = Query(default=""),
    db: Session = Depends(get_db),
    _=_admin,
):
    """Download all (filtered) teams as CSV."""
    query = db.query(Team)
    if event_slug:
        query = query.filter(Team.event_slug == event_slug)
    if status:
        query = query.filter(Team.status == status)

    teams = query.order_by(Team.created_at.desc()).all()

    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow([
        "Registration ID", "Team Name", "Institution", "City", "State",
        "Event", "Status", "Members", "Payment", "Registered On",
    ])
    for t in teams:
        paid = db.query(Payment).filter(Payment.team_id == t.id, Payment.status == "paid").first()
        w.writerow([
            t.registration_id, t.team_name, t.institution, t.city, t.state,
            t.event_slug, t.status, len(t.members),
            "Paid" if paid else "Pending",
            t.created_at.strftime("%Y-%m-%d %H:%M") if t.created_at else "",
        ])

    buf.seek(0)
    filename = f"xspeed_teams_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    return StreamingResponse(
        iter([buf.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.get("/teams")
def list_teams(
    q:          str = Query(default=""),
    event_slug: str = Query(default=""),
    status:     str = Query(default=""),
    state:      str = Query(default=""),
    skip:       int = Query(default=0, ge=0),
    limit:      int = Query(default=50, le=200),
    db: Session = Depends(get_db),
    _=_admin,
):
    query = db.query(Team)
    if q:
        like = f"%{q}%"
        query = query.filter(
            Team.team_name.ilike(like)
            | Team.registration_id.ilike(like)
            | Team.institution.ilike(like)
        )
    if event_slug:
        query = query.filter(Team.event_slug == event_slug)
    if status:
        query = query.filter(Team.status == status)
    if state:
        query = query.filter(Team.state.ilike(f"%{state}%"))

    total = query.count()
    teams = query.order_by(Team.created_at.desc()).offset(skip).limit(limit).all()

    results = []
    for t in teams:
        paid = db.query(Payment).filter(Payment.team_id == t.id, Payment.status == "paid").first()
        docs = db.query(Document).filter(Document.team_id == t.id).all()
        results.append({
            "id":              t.id,
            "registration_id": t.registration_id,
            "team_name":       t.team_name,
            "institution":     t.institution,
            "city":            t.city,
            "state":           t.state,
            "event_slug":      t.event_slug,
            "status":          t.status,
            "member_count":    len(t.members),
            "payment_status":  paid.status if paid else None,
            "docs_uploaded":   len(docs),
            "docs_approved":   sum(1 for d in docs if d.status == "approved"),
            "created_at":      t.created_at.isoformat() if t.created_at else None,
        })

    return {"total": total, "teams": results}


@router.get("/teams/{team_id}")
def get_team_detail(team_id: int, db: Session = Depends(get_db), _=_admin):
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    leader  = db.query(User).filter(User.id == team.leader_id).first()
    payment = (
        db.query(Payment)
        .filter(Payment.team_id == team.id)
        .order_by(Payment.created_at.desc())
        .first()
    )
    docs  = db.query(Document).filter(Document.team_id == team.id).all()
    event = db.query(Event).filter(Event.slug == team.event_slug).first()

    return {
        "id":              team.id,
        "registration_id": team.registration_id,
        "team_name":       team.team_name,
        "institution":     team.institution,
        "city":            team.city,
        "state":           team.state,
        "event_slug":      team.event_slug,
        "event_name":      event.display_name if event else team.event_slug,
        "status":          team.status,
        "created_at":      team.created_at.isoformat() if team.created_at else None,
        "leader": {
            "id":        leader.id        if leader else None,
            "full_name": leader.full_name if leader else "",
            "email":     leader.email     if leader else "",
            "phone":     leader.phone     if leader else "",
        },
        "members": [
            {
                "id":            m.id,
                "name":          m.name,
                "email":         m.email,
                "phone":         m.phone,
                "date_of_birth": m.date_of_birth,
            }
            for m in team.members
        ],
        "documents": [
            {
                "id":                d.id,
                "doc_type":          d.doc_type,
                "label":             DOC_LABELS.get(d.doc_type, d.doc_type),
                "original_filename": d.original_filename,
                "file_size":         d.file_size,
                "status":            d.status,
                "reviewer_note":     d.reviewer_note,
                "uploaded_at":       d.uploaded_at.isoformat() if d.uploaded_at else None,
            }
            for d in docs
        ],
        "payment": {
            "id":                   payment.id,
            "razorpay_order_id":    payment.razorpay_order_id,
            "razorpay_payment_id":  payment.razorpay_payment_id,
            "amount_paise":         payment.amount_paise,
            "amount_inr":           round(payment.amount_paise / 100, 2),
            "status":               payment.status,
            "paid_at":              payment.paid_at.isoformat() if payment.paid_at else None,
        }
        if payment
        else None,
    }


@router.put("/teams/{team_id}/status")
def update_team_status(
    team_id: int,
    data:    TeamStatusIn,
    db:      Session = Depends(get_db),
    _=_admin,
):
    ALLOWED = {"under_review", "approved", "rejected", "waitlisted", "cancelled"}
    if data.status not in ALLOWED:
        raise HTTPException(status_code=400, detail=f"Allowed statuses: {', '.join(ALLOWED)}")

    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    old_status  = team.status
    team.status = data.status
    db.commit()

    leader = db.query(User).filter(User.id == team.leader_id).first()
    event  = db.query(Event).filter(Event.slug == team.event_slug).first()
    if leader:
        send_team_status_email(
            to_email=leader.email,
            full_name=leader.full_name,
            team_name=team.team_name,
            registration_id=team.registration_id,
            event_name=event.display_name if event else team.event_slug,
            status=data.status,
            note=data.note,
        )
        _STATUS_TITLES = {
            "approved":     "Registration Approved",
            "rejected":     "Registration Rejected",
            "waitlisted":   "Registration Waitlisted",
            "under_review": "Registration Under Review",
            "cancelled":    "Registration Cancelled",
        }
        notif_title = _STATUS_TITLES.get(data.status, f"Status Updated: {data.status.replace('_', ' ').title()}")
        notif_msg   = (
            f"Your team '{team.team_name}' ({team.registration_id}) registration status has been updated to: "
            f"{data.status.replace('_', ' ').upper()}."
        )
        if data.note:
            notif_msg += f"\n\nNote from admin: {data.note}"
        _notify(db, leader.id, notif_title, notif_msg, "status_update")

    return {
        "message": f"Status updated: {old_status} → {data.status}",
        "team_id": team_id,
        "status":  data.status,
    }


@router.post("/teams/{team_id}/message")
def send_message_to_team(
    team_id: int,
    data: AdminMessageIn,
    db: Session = Depends(get_db),
    _=_admin,
):
    if not data.subject.strip() or not data.message.strip():
        raise HTTPException(status_code=400, detail="Subject and message are required")

    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    leader = db.query(User).filter(User.id == team.leader_id).first()
    event  = db.query(Event).filter(Event.slug == team.event_slug).first()
    if not leader:
        raise HTTPException(status_code=404, detail="Team leader not found")

    send_admin_message_email(
        to_email=leader.email,
        full_name=leader.full_name,
        team_name=team.team_name,
        registration_id=team.registration_id,
        event_name=event.display_name if event else team.event_slug,
        subject=data.subject,
        message=data.message,
    )
    _notify(db, leader.id, data.subject, data.message, "message")

    return {"message": "Message sent", "to": leader.email}


# ── Documents ────────────────────────────────────────────────────────────────

@router.get("/documents")
def list_documents(
    status:     str = Query(default=""),
    event_slug: str = Query(default=""),
    skip:       int = Query(default=0, ge=0),
    limit:      int = Query(default=50, le=200),
    db: Session = Depends(get_db),
    _=_admin,
):
    query = db.query(Document)
    if status:
        query = query.filter(Document.status == status)

    total = query.count()
    docs  = query.order_by(Document.uploaded_at.desc()).offset(skip).limit(limit).all()

    results = []
    for d in docs:
        team = db.query(Team).filter(Team.id == d.team_id).first()
        if event_slug and team and team.event_slug != event_slug:
            continue
        results.append({
            "id":                d.id,
            "team_id":           d.team_id,
            "team_name":         team.team_name       if team else "",
            "registration_id":   team.registration_id if team else "",
            "event_slug":        team.event_slug       if team else "",
            "doc_type":          d.doc_type,
            "label":             DOC_LABELS.get(d.doc_type, d.doc_type),
            "original_filename": d.original_filename,
            "file_size":         d.file_size,
            "status":            d.status,
            "reviewer_note":     d.reviewer_note,
            "uploaded_at":       d.uploaded_at.isoformat() if d.uploaded_at else None,
        })

    return {"total": total, "documents": results}


@router.put("/documents/{doc_id}/review")
def review_document(
    doc_id: int,
    data:   DocumentReviewIn,
    db:     Session = Depends(get_db),
    _=_admin,
):
    ALLOWED = {"approved", "rejected", "reupload_requested"}
    if data.status not in ALLOWED:
        raise HTTPException(status_code=400, detail=f"Allowed statuses: {', '.join(ALLOWED)}")

    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    doc.status        = data.status
    doc.reviewer_note = data.reviewer_note
    doc.reviewed_at   = datetime.utcnow()
    db.commit()
    db.refresh(doc)

    team = db.query(Team).filter(Team.id == doc.team_id).first()
    if team:
        leader = db.query(User).filter(User.id == team.leader_id).first()
        doc_label = DOC_LABELS.get(doc.doc_type, doc.doc_type)
        if leader:
            send_document_review_email(
                to_email=leader.email,
                full_name=leader.full_name,
                team_name=team.team_name,
                doc_label=doc_label,
                status=data.status,
                note=data.reviewer_note,
            )
            _DOC_TITLES = {
                "approved":           f"{doc_label} Approved",
                "rejected":           f"{doc_label} Rejected",
                "reupload_requested": f"{doc_label}: Re-upload Required",
            }
            _DOC_ACTIONS = {
                "approved":           "has been approved.",
                "rejected":           "has been rejected. Please re-upload a corrected version.",
                "reupload_requested": "requires re-upload. Please upload a new copy.",
            }
            notif_title = _DOC_TITLES.get(data.status, f"{doc_label}: {data.status}")
            notif_msg   = f"Your document '{doc_label}' {_DOC_ACTIONS.get(data.status, 'status changed.')}."
            if data.reviewer_note:
                notif_msg += f"\n\nReviewer note: {data.reviewer_note}"
            _notify(db, leader.id, notif_title, notif_msg, "document")

    return {"message": f"Document {data.status}", "doc_id": doc_id, "status": data.status}


@router.get("/documents/{doc_id}/download")
def admin_download_document(doc_id: int, db: Session = Depends(get_db), _=_admin):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if not os.path.exists(doc.file_path):
        raise HTTPException(status_code=404, detail="File not found on server")
    return FileResponse(
        doc.file_path,
        filename=doc.original_filename,
        media_type="application/octet-stream",
    )


# ── Payments ─────────────────────────────────────────────────────────────────

@router.get("/payments")
def list_payments(
    status: str = Query(default=""),
    skip:   int = Query(default=0, ge=0),
    limit:  int = Query(default=50, le=200),
    db: Session = Depends(get_db),
    _=_admin,
):
    query = db.query(Payment)
    if status:
        query = query.filter(Payment.status == status)

    total    = query.count()
    payments = query.order_by(Payment.created_at.desc()).offset(skip).limit(limit).all()

    results = []
    for p in payments:
        team = db.query(Team).filter(Team.id == p.team_id).first()
        results.append({
            "id":                  p.id,
            "team_id":             p.team_id,
            "team_name":           team.team_name       if team else "",
            "registration_id":     team.registration_id if team else "",
            "event_slug":          team.event_slug       if team else "",
            "razorpay_order_id":   p.razorpay_order_id,
            "razorpay_payment_id": p.razorpay_payment_id,
            "amount_paise":        p.amount_paise,
            "amount_inr":          round(p.amount_paise / 100, 2),
            "status":              p.status,
            "created_at":          p.created_at.isoformat() if p.created_at else None,
            "paid_at":             p.paid_at.isoformat()    if p.paid_at    else None,
        })

    return {"total": total, "payments": results}
