import enum
from datetime import datetime

from sqlalchemy import String, DateTime, Enum, Integer, Text, Boolean, Float
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
    budget_allocated: Mapped[float] = mapped_column(Float, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class ExpenseEntry(Base):
    """Append-only fund ledger — never edit; corrections = new offsetting entry."""

    __tablename__ = "expense_entries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    event_id: Mapped[int] = mapped_column(Integer, index=True)
    amount: Mapped[float] = mapped_column(Float)
    category: Mapped[str] = mapped_column(String(64), default="other")
    description: Mapped[str] = mapped_column(Text, default="")
    receipt_url: Mapped[str] = mapped_column(String(512), default="")
    added_by: Mapped[int] = mapped_column(Integer)
    added_by_name: Mapped[str] = mapped_column(String(255), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)


class VolunteerSignup(Base):
    __tablename__ = "volunteer_signups"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    event_id: Mapped[int] = mapped_column(Integer, index=True)
    user_id: Mapped[int] = mapped_column(Integer, index=True)
    user_name: Mapped[str] = mapped_column(String(255))
    attended: Mapped[bool] = mapped_column(Boolean, default=False)
    certificate_code: Mapped[str] = mapped_column(String(64), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
