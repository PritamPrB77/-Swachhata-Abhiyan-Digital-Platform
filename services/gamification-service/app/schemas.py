from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class AwardRequest(BaseModel):
    action: str
    ref_type: str = ""
    ref_id: str = ""
    note: str = ""


class ProfileOut(BaseModel):
    user_id: int
    display_name: str
    role: str
    ward: str
    xp: int
    points: int
    level: int
    tier: str
    daily_streak: int
    weekly_streak: int
    xp_to_next_level: int
    badges_count: int = 0


class BadgeOut(BaseModel):
    code: str
    name: str
    description: str
    icon: str
    bonus_xp: int
    earned: bool = False
    earned_at: Optional[datetime] = None


class MissionOut(BaseModel):
    code: str
    title: str
    description: str
    period: str
    target_count: int
    reward_xp: int
    progress: int
    completed: bool


class ChallengeOut(BaseModel):
    code: str
    title: str
    description: str
    scope: str
    reward_xp: int
    starts_at: datetime
    ends_at: datetime
    active: bool


class RewardItemOut(BaseModel):
    id: int
    code: str
    name: str
    description: str
    cost_points: int
    item_type: str
    stock: int


class RedeemRequest(BaseModel):
    item_code: str


class LeaderboardEntry(BaseModel):
    rank: int
    user_id: int
    display_name: str
    role: str
    ward: str
    xp: int
    level: int
    tier: str


class WardLeaderboardEntry(BaseModel):
    rank: int
    ward: str
    total_xp: int
    citizen_count: int
    cleanliness_score: float


class NotificationOut(BaseModel):
    id: int
    title: str
    body: str
    kind: str
    read: bool
    created_at: datetime

    class Config:
        from_attributes = True


class AwardResult(BaseModel):
    awarded: bool
    xp_gained: int = 0
    points_gained: int = 0
    level: int = 1
    tier: str = "beginner"
    new_badges: list[str] = Field(default_factory=list)
    message: str = ""
