from pydantic import BaseModel, EmailStr
from datetime import datetime


class UserRegister(BaseModel):
    full_name: str
    email: EmailStr
    phone: str
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class ResetPassword(BaseModel):
    email: EmailStr
    new_password: str


class UserOut(BaseModel):
    id: int
    full_name: str
    email: str
    phone: str
    role: str
    is_active: bool
    is_verified: bool
    created_at: datetime

    model_config = {"from_attributes": True}
