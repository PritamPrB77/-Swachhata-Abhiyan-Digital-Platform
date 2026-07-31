from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.models import ComplaintCategory, ComplaintStatus


class ComplaintCreate(BaseModel):
    category: ComplaintCategory
    description: str = Field(min_length=5)
    latitude: float
    longitude: float
    ward: str = "Ward-1"
    image_key: str = ""


class ComplaintUpdate(BaseModel):
    status: Optional[ComplaintStatus] = None
    assignee_id: Optional[int] = None
    assignee_name: Optional[str] = None


class ComplaintOut(BaseModel):
    id: int
    citizen_id: int
    citizen_name: str
    category: ComplaintCategory
    description: str
    latitude: float
    longitude: float
    ward: str
    image_key: str
    image_url: str = ""
    status: ComplaintStatus
    assignee_id: Optional[int]
    assignee_name: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
