import enum
from datetime import date, datetime

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    Enum,
    Float,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Tier(str, enum.Enum):
    beginner = "beginner"
    contributor = "contributor"
    champion = "champion"
    hero = "hero"
    legend = "legend"


class MissionPeriod(str, enum.Enum):
    daily = "daily"
    weekly = "weekly"
    monthly = "monthly"
    seasonal = "seasonal"


class PlayerProfile(Base):
    __tablename__ = "player_profiles"

    user_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    display_name: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(50), default="citizen")
    ward: Mapped[str] = mapped_column(String(100), default="Ward-1")
    xp: Mapped[int] = mapped_column(Integer, default=0)
    points: Mapped[int] = mapped_column(Integer, default=0)  # redeemable
    level: Mapped[int] = mapped_column(Integer, default=1)
    tier: Mapped[Tier] = mapped_column(Enum(Tier), default=Tier.beginner)
    daily_streak: Mapped[int] = mapped_column(Integer, default=0)
    weekly_streak: Mapped[int] = mapped_column(Integer, default=0)
    last_login_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    last_weekly_mark: Mapped[date | None] = mapped_column(Date, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )


class XpLedger(Base):
    __tablename__ = "xp_ledger"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(Integer, index=True)
    action: Mapped[str] = mapped_column(String(100), index=True)
    xp_delta: Mapped[int] = mapped_column(Integer)
    points_delta: Mapped[int] = mapped_column(Integer, default=0)
    ref_type: Mapped[str] = mapped_column(String(50), default="")
    ref_id: Mapped[str] = mapped_column(String(100), default="")
    note: Mapped[str] = mapped_column(String(255), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)

    __table_args__ = (
        UniqueConstraint("user_id", "action", "ref_type", "ref_id", name="uq_xp_event"),
    )


class Badge(Base):
    __tablename__ = "badges"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    code: Mapped[str] = mapped_column(String(64), unique=True)
    name: Mapped[str] = mapped_column(String(120))
    description: Mapped[str] = mapped_column(Text)
    icon: Mapped[str] = mapped_column(String(32), default="🏅")
    bonus_xp: Mapped[int] = mapped_column(Integer, default=0)


class UserBadge(Base):
    __tablename__ = "user_badges"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(Integer, index=True)
    badge_id: Mapped[int] = mapped_column(Integer, index=True)
    earned_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    __table_args__ = (UniqueConstraint("user_id", "badge_id", name="uq_user_badge"),)


class Mission(Base):
    __tablename__ = "missions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    code: Mapped[str] = mapped_column(String(64), unique=True)
    title: Mapped[str] = mapped_column(String(160))
    description: Mapped[str] = mapped_column(Text)
    period: Mapped[MissionPeriod] = mapped_column(Enum(MissionPeriod))
    target_count: Mapped[int] = mapped_column(Integer, default=1)
    reward_xp: Mapped[int] = mapped_column(Integer, default=50)
    action_key: Mapped[str] = mapped_column(String(100))  # which award action counts
    active: Mapped[bool] = mapped_column(Boolean, default=True)


class MissionProgress(Base):
    __tablename__ = "mission_progress"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(Integer, index=True)
    mission_id: Mapped[int] = mapped_column(Integer, index=True)
    progress: Mapped[int] = mapped_column(Integer, default=0)
    completed: Mapped[bool] = mapped_column(Boolean, default=False)
    period_key: Mapped[str] = mapped_column(String(32), index=True)  # e.g. 2026-W31
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    __table_args__ = (
        UniqueConstraint("user_id", "mission_id", "period_key", name="uq_mission_period"),
    )


class Challenge(Base):
    __tablename__ = "challenges"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    code: Mapped[str] = mapped_column(String(64), unique=True)
    title: Mapped[str] = mapped_column(String(160))
    description: Mapped[str] = mapped_column(Text)
    scope: Mapped[str] = mapped_column(String(40), default="community")  # community|ward|city
    reward_xp: Mapped[int] = mapped_column(Integer, default=200)
    starts_at: Mapped[datetime] = mapped_column(DateTime)
    ends_at: Mapped[datetime] = mapped_column(DateTime)
    active: Mapped[bool] = mapped_column(Boolean, default=True)


class RewardItem(Base):
    __tablename__ = "reward_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    code: Mapped[str] = mapped_column(String(64), unique=True)
    name: Mapped[str] = mapped_column(String(160))
    description: Mapped[str] = mapped_column(Text)
    cost_points: Mapped[int] = mapped_column(Integer)
    item_type: Mapped[str] = mapped_column(String(40))  # coupon|certificate|digital_badge
    stock: Mapped[int] = mapped_column(Integer, default=100)
    active: Mapped[bool] = mapped_column(Boolean, default=True)


class Redemption(Base):
    __tablename__ = "redemptions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(Integer, index=True)
    item_id: Mapped[int] = mapped_column(Integer)
    code_issued: Mapped[str] = mapped_column(String(64))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class GameNotification(Base):
    __tablename__ = "game_notifications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(Integer, index=True)
    title: Mapped[str] = mapped_column(String(160))
    body: Mapped[str] = mapped_column(Text)
    kind: Mapped[str] = mapped_column(String(40))  # xp|badge|mission|challenge|reward
    read: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)


class WardScore(Base):
    __tablename__ = "ward_scores"

    ward: Mapped[str] = mapped_column(String(100), primary_key=True)
    total_xp: Mapped[int] = mapped_column(Integer, default=0)
    citizen_count: Mapped[int] = mapped_column(Integer, default=0)
    cleanliness_score: Mapped[float] = mapped_column(Float, default=0.0)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class WalletPayout(Base):
    """Append-only payout requests — real cash via stubbed partner API, not custodial balance."""

    __tablename__ = "wallet_payouts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(Integer, index=True)
    kind: Mapped[str] = mapped_column(String(40), default="redeem")
    points: Mapped[int] = mapped_column(Integer)
    inr_amount: Mapped[float] = mapped_column(Float, default=0)
    upi_id: Mapped[str] = mapped_column(String(120), default="")
    status: Mapped[str] = mapped_column(String(40), default="pending")  # pending|processing|completed|failed
    provider_ref: Mapped[str] = mapped_column(String(120), default="")
    note: Mapped[str] = mapped_column(String(255), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
