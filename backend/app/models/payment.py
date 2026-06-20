from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from app.database import Base


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=False)

    razorpay_order_id = Column(String, unique=True, nullable=False)
    razorpay_payment_id = Column(String, nullable=True)
    razorpay_signature = Column(String, nullable=True)

    amount_paise = Column(Integer, nullable=False)   # amount in paise (INR × 100)
    currency = Column(String, default="INR", nullable=False)

    # created | paid | failed
    status = Column(String, default="created", nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow)
    paid_at = Column(DateTime, nullable=True)
