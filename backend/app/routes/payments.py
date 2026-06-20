import hmac
import hashlib
from datetime import datetime

import razorpay
from razorpay.errors import BadRequestError as RazorpayBadRequestError
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.payment import Payment
from app.models.team import Team
from app.models.event import Event
from app.models.user import User
from app.schemas.payment import PaymentOrderOut, PaymentVerifyIn, PaymentOut
from app.dependencies import get_current_user
from app.config import RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET

router = APIRouter(prefix="/api/payments", tags=["Payments"])


def _get_team(db: Session, user: User, event_slug: str = "") -> Team:
    query = db.query(Team).filter(Team.leader_id == user.id)
    if event_slug:
        query = query.filter(Team.event_slug == event_slug)
    team = query.order_by(Team.created_at.desc()).first()
    if not team:
        raise HTTPException(status_code=404, detail="No team registration found")
    return team


def _calculate_amount(event: Event, member_count: int) -> tuple[int, dict]:
    """Returns (total_paise, breakdown_dict)."""
    base = float(event.registration_fee)
    per_member_total = float(event.per_member_fee) * member_count
    subtotal = base + per_member_total
    gst_amount = subtotal * (float(event.gst_percentage) / 100)
    grand_total = subtotal + gst_amount

    breakdown = {
        "registration_fee": base,
        "per_member_fee": float(event.per_member_fee),
        "member_count": member_count,
        "per_member_total": per_member_total,
        "subtotal": subtotal,
        "gst_percentage": float(event.gst_percentage),
        "gst_amount": round(gst_amount, 2),
        "grand_total": round(grand_total, 2),
    }
    return int(grand_total * 100), breakdown  # paise


@router.post("/create-order", response_model=PaymentOrderOut)
def create_order(
    event_slug: str = "",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not RAZORPAY_KEY_ID or not RAZORPAY_KEY_SECRET:
        raise HTTPException(
            status_code=503,
            detail="Payment gateway not configured. Please contact the administrator."
        )

    team = _get_team(db, current_user, event_slug)

    existing_paid = db.query(Payment).filter(
        Payment.team_id == team.id,
        Payment.status == "paid",
    ).first()
    if existing_paid:
        raise HTTPException(status_code=400, detail="Payment already completed for this team")

    event = db.query(Event).filter(Event.slug == team.event_slug).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    member_count = len(team.members)
    amount_paise, breakdown = _calculate_amount(event, member_count)

    if amount_paise <= 0:
        raise HTTPException(
            status_code=400,
            detail="Event fees are not yet configured. Please contact the administrator."
        )

    try:
        rzp = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))
        order = rzp.order.create({
            "amount": amount_paise,
            "currency": "INR",
            "receipt": team.registration_id,
            "notes": {
                "team_name": team.team_name,
                "event": event.display_name,
            },
        })
    except RazorpayBadRequestError:
        raise HTTPException(
            status_code=503,
            detail="Payment gateway not configured. Please contact the administrator.",
        )

    # Replace any pending order for this team
    pending = db.query(Payment).filter(
        Payment.team_id == team.id,
        Payment.status == "created",
    ).first()

    if pending:
        pending.razorpay_order_id = order["id"]
        pending.amount_paise = amount_paise
        pending.created_at = datetime.utcnow()
        db.commit()
    else:
        db.add(Payment(
            team_id=team.id,
            razorpay_order_id=order["id"],
            amount_paise=amount_paise,
        ))
        db.commit()

    return PaymentOrderOut(
        order_id=order["id"],
        amount_paise=amount_paise,
        amount_inr=amount_paise / 100,
        currency="INR",
        key_id=RAZORPAY_KEY_ID,
        team_name=team.team_name,
        event_name=event.display_name,
        breakdown=breakdown,
    )


@router.post("/verify", response_model=PaymentOut)
def verify_payment(
    data: PaymentVerifyIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    body = f"{data.razorpay_order_id}|{data.razorpay_payment_id}"
    expected = hmac.new(
        RAZORPAY_KEY_SECRET.encode("utf-8"),
        body.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()

    if not hmac.compare_digest(expected, data.razorpay_signature):
        raise HTTPException(status_code=400, detail="Invalid payment signature — possible tampering")

    payment = db.query(Payment).filter(
        Payment.razorpay_order_id == data.razorpay_order_id,
    ).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Order not found")

    payment.razorpay_payment_id = data.razorpay_payment_id
    payment.razorpay_signature = data.razorpay_signature
    payment.status = "paid"
    payment.paid_at = datetime.utcnow()

    team = db.query(Team).filter(Team.id == payment.team_id).first()
    if team:
        team.status = "payment_done"

    db.commit()
    db.refresh(payment)
    return payment


@router.get("/mine", response_model=PaymentOut)
def get_my_payment(
    event_slug: str = "",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    team = _get_team(db, current_user, event_slug)
    payment = (
        db.query(Payment)
        .filter(Payment.team_id == team.id)
        .order_by(Payment.created_at.desc())
        .first()
    )
    if not payment:
        raise HTTPException(status_code=404, detail="No payment record found")
    return payment
