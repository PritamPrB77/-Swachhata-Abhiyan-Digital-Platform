import enum
from datetime import datetime

from sqlalchemy import String, DateTime, Enum, Integer, Text, Boolean
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class DriveStatus(str, enum.Enum):
    upcoming = "upcoming"
    ongoing = "ongoing"
    completed = "completed"
    cancelled = "cancelled"


class DriveEvent(Base):
    __tablename__ = "drive_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text, default="")
    location: Mapped[str] = mapped_column(String(255))
    ward: Mapped[str] = mapped_column(String(100), default="Ward-1")
    starts_at: Mapped[datetime] = mapped_column(DateTime)
    ends_at: Mapped[datetime] = mapped_column(DateTime)
    capacity: Mapped[int] = mapped_column(Integer, default=50)
    status: Mapped[DriveStatus] = mapped_column(Enum(DriveStatus), default=DriveStatus.upcoming)
    created_by: Mapped[int] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class VolunteerSignup(Base):
    __tablename__ = "volunteer_signups"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    event_id: Mapped[int] = mapped_column(Integer, index=True)
    user_id: Mapped[int] = mapped_column(Integer, index=True)
    user_name: Mapped[str] = mapped_column(String(255))
    attended: Mapped[bool] = mapped_column(Boolean, default=False)
    certificate_code: Mapped[str] = mapped_column(String(64), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
