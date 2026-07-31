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
    created_at: datetime
    signup_count: int = 0

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
