from datetime import date, datetime, timedelta

TIER_THRESHOLDS = [
    (1, "beginner", 0),
    (5, "contributor", 200),
    (10, "champion", 800),
    (20, "hero", 2000),
    (35, "legend", 5000),
]

# XP required roughly level^2 * 40
def xp_for_level(level: int) -> int:
    return level * level * 40


def level_from_xp(xp: int) -> int:
    level = 1
    while xp_for_level(level + 1) <= xp:
        level += 1
        if level > 100:
            break
    return level


def tier_from_xp(xp: int) -> str:
    current = "beginner"
    for _, tier, need in TIER_THRESHOLDS:
        if xp >= need:
            current = tier
    return current


ACTION_REWARDS = {
    "daily_login": {"xp": 5, "points": 2},
    "complaint_submitted": {"xp": 10, "points": 5},
    "complaint_verified": {"xp": 20, "points": 10},
    "complaint_resolved": {"xp": 40, "points": 20},
    "volunteer_event": {"xp": 50, "points": 25},
    "weekly_streak": {"xp": 50, "points": 20},
    "monthly_challenge": {"xp": 200, "points": 80},
    "gps_shift_complete": {"xp": 15, "points": 8},
}


def period_key(period: str, now: datetime | None = None) -> str:
    now = now or datetime.utcnow()
    if period == "daily":
        return now.strftime("%Y-%m-%d")
    if period == "weekly":
        iso = now.isocalendar()
        return f"{iso.year}-W{iso.week:02d}"
    if period == "monthly":
        return now.strftime("%Y-%m")
    return now.strftime("%Y")


def yesterday(d: date) -> date:
    return d - timedelta(days=1)
