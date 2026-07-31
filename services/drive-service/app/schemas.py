from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.models import DriveStatus


class DriveCreate(BaseModel):
    title: str
    description: str = ""
    location: str
    ward: str = "Ward-1"
    starts_at: datetime
    ends_at: datetime
    capacity: int = Field(default=50, ge=1)
    budget_allocated: float = 0


class DriveOut(BaseModel):
    id: int
    title: str
    description: str
    location: str
    ward: str
    starts_at: datetime
    ends_at: datetime
    capacity: int
    status: DriveStatus
    created_by: int
    budget_allocated: float = 0
    created_at: datetime
    signup_count: int = 0
    spent: float = 0
    remaining: float = 0

    class Config:
        from_attributes = True


class ExpenseCreate(BaseModel):
    amount: float = Field(gt=0)
    category: str = "other"
    description: str = ""
    receipt_url: str = ""


class ExpenseOut(BaseModel):
    id: int
    event_id: int
    amount: float
    category: str
    description: str
    receipt_url: str
    added_by: int
    added_by_name: str
    created_at: datetime

    class Config:
        from_attributes = True


class SignupOut(BaseModel):
    id: int
    event_id: int
    user_id: int
    user_name: str
    attended: bool
    certificate_code: str
    created_at: datetime

    class Config:
        from_attributes = True
