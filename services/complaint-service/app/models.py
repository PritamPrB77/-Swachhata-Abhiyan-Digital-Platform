import enum
from datetime import datetime

from sqlalchemy import String, DateTime, Enum, Integer, Float, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class ComplaintCategory(str, enum.Enum):
    garbage = "garbage"
    street_cleaning = "street_cleaning"
    toilet = "toilet"
    drainage = "drainage"
    other = "other"


class ComplaintStatus(str, enum.Enum):
    submitted = "submitted"
    assigned = "assigned"
    in_progress = "in_progress"
    resolved = "resolved"
    rejected = "rejected"


class UrgencyLevel(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"


class Complaint(Base):
    __tablename__ = "complaints"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    citizen_id: Mapped[int] = mapped_column(Integer, index=True)
    citizen_name: Mapped[str] = mapped_column(String(255))
    category: Mapped[ComplaintCategory] = mapped_column(Enum(ComplaintCategory))
    description: Mapped[str] = mapped_column(Text)
    latitude: Mapped[float] = mapped_column(Float)
    longitude: Mapped[float] = mapped_column(Float)
    photo_latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    photo_longitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    ward: Mapped[str] = mapped_column(String(100), default="Ward-1")
    image_key: Mapped[str] = mapped_column(String(512), default="")
    urgency: Mapped[str] = mapped_column(String(20), default="medium", index=True)
    sentiment_score: Mapped[float] = mapped_column(Float, default=0.0)
    sentiment_label: Mapped[str] = mapped_column(String(40), default="neutral")
    status: Mapped[ComplaintStatus] = mapped_column(
        Enum(ComplaintStatus), default=ComplaintStatus.submitted
    )
    assignee_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    assignee_name: Mapped[str] = mapped_column(String(255), default="")
    officer_notes: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )


class ComplaintComment(Base):
    __tablename__ = "complaint_comments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    complaint_id: Mapped[int] = mapped_column(Integer, index=True)
    user_id: Mapped[int] = mapped_column(Integer, index=True)
    user_name: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(40), default="")
    body: Mapped[str] = mapped_column(Text)
    sentiment_score: Mapped[float] = mapped_column(Float, default=0.0)
    sentiment_label: Mapped[str] = mapped_column(String(40), default="neutral")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
