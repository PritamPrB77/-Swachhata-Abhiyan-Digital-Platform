from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.models import ComplaintCategory, ComplaintStatus


class ComplaintCreate(BaseModel):
    category: ComplaintCategory
    description: str = Field(min_length=5)
    latitude: float
    longitude: float
    photo_latitude: Optional[float] = None
    photo_longitude: Optional[float] = None
    ward: str = "Ward-1"
    image_key: str = ""
    # Client may send pre-analyzed values; server re-validates
    urgency: Optional[str] = None
    sentiment_score: Optional[float] = None
    sentiment_label: Optional[str] = None


class ComplaintUpdate(BaseModel):
    status: Optional[ComplaintStatus] = None
    assignee_id: Optional[int] = None
    assignee_name: Optional[str] = None
    officer_notes: Optional[str] = None
    urgency: Optional[str] = None


class ComplaintOut(BaseModel):
    id: int
    citizen_id: int
    citizen_name: str
    category: ComplaintCategory
    description: str
    latitude: float
    longitude: float
    photo_latitude: Optional[float] = None
    photo_longitude: Optional[float] = None
    ward: str
    image_key: str
    image_url: str = ""
    urgency: str = "medium"
    sentiment_score: float = 0.0
    sentiment_label: str = "neutral"
    status: ComplaintStatus
    assignee_id: Optional[int]
    assignee_name: str
    officer_notes: str = ""
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CommentCreate(BaseModel):
    body: str = Field(min_length=2, max_length=2000)


class CommentOut(BaseModel):
    id: int
    complaint_id: int
    user_id: int
    user_name: str
    role: str
    body: str
    sentiment_score: float
    sentiment_label: str
    created_at: datetime

    class Config:
        from_attributes = True


class AnalyzeRequest(BaseModel):
    text: str


class StatsOut(BaseModel):
    total: int
    pending: int
    in_progress: int
    resolved: int
    critical: int
    high: int
