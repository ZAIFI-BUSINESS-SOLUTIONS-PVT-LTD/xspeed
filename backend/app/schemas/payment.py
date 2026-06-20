from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class PaymentOrderOut(BaseModel):
    order_id: str
    amount_paise: int
    amount_inr: float
    currency: str
    key_id: str
    team_name: str
    event_name: str
    breakdown: dict


class PaymentVerifyIn(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


class PaymentOut(BaseModel):
    id: int
    team_id: int
    razorpay_order_id: str
    razorpay_payment_id: Optional[str] = None
    amount_paise: int
    currency: str
    status: str
    created_at: datetime
    paid_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
