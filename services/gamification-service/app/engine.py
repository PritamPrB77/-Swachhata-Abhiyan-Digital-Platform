"""Core gamification engine — profiles, awards, badges, missions."""
from datetime import date, datetime

from sqlalchemy.orm import Session

from app.models import (
    Badge,
    Challenge,
    GameNotification,
    Mission,
    MissionProgress,
    PlayerProfile,
    Redemption,
    RewardItem,
    Tier,
    UserBadge,
    WardScore,
    XpLedger,
)
from app.rules import (
    ACTION_REWARDS,
    level_from_xp,
    period_key,
    tier_from_xp,
    xp_for_level,
    yesterday,
)
from app.schemas import AwardResult


def ensure_profile(db: Session, user_id: int, name: str, role: str, ward: str) -> PlayerProfile:
    profile = db.get(PlayerProfile, user_id)
    if profile:
        profile.display_name = name or profile.display_name
        profile.role = role or profile.role
        profile.ward = ward or profile.ward
        return profile
    profile = PlayerProfile(
        user_id=user_id,
        display_name=name or f"User {user_id}",
        role=role,
        ward=ward,
    )
    db.add(profile)
    db.flush()
    _bump_ward(db, ward, 0, new_citizen=True)
    return profile


def _notify(db: Session, user_id: int, title: str, body: str, kind: str) -> None:
    db.add(
        GameNotification(user_id=user_id, title=title, body=body, kind=kind)
    )


def _bump_ward(db: Session, ward: str, xp: int, new_citizen: bool = False) -> None:
    row = db.get(WardScore, ward)
    if not row:
        row = WardScore(ward=ward, total_xp=0, citizen_count=0, cleanliness_score=50.0)
        db.add(row)
        db.flush()
    row.total_xp += xp
    if new_citizen:
        row.citizen_count += 1
    row.cleanliness_score = min(100.0, 40 + (row.total_xp / max(row.citizen_count, 1)) * 0.05)
    row.updated_at = datetime.utcnow()


def _recalc(profile: PlayerProfile) -> None:
    profile.level = level_from_xp(profile.xp)
    profile.tier = Tier(tier_from_xp(profile.xp))


def _try_badges(db: Session, profile: PlayerProfile) -> list[str]:
    earned_ids = {
        ub.badge_id
        for ub in db.query(UserBadge).filter(UserBadge.user_id == profile.user_id).all()
    }
    badges = db.query(Badge).all()
    action_counts = {}
    for row in db.query(XpLedger).filter(XpLedger.user_id == profile.user_id).all():
        action_counts[row.action] = action_counts.get(row.action, 0) + 1

    unlocked: list[str] = []

    def grant(code: str) -> None:
        badge = next((b for b in badges if b.code == code), None)
        if not badge or badge.id in earned_ids:
            return
        db.add(UserBadge(user_id=profile.user_id, badge_id=badge.id))
        earned_ids.add(badge.id)
        if badge.bonus_xp:
            profile.xp += badge.bonus_xp
            profile.points += badge.bonus_xp // 2
        unlocked.append(badge.code)
        _notify(
            db,
            profile.user_id,
            f"Badge unlocked: {badge.name}",
            badge.description,
            "badge",
        )

    if action_counts.get("complaint_submitted", 0) >= 1:
        grant("first_complaint")
    if action_counts.get("complaint_resolved", 0) >= 3:
        grant("cleanliness_hero")
    if action_counts.get("volunteer_event", 0) >= 1:
        grant("volunteer_star")
    if profile.daily_streak >= 7:
        grant("weekly_warrior")
    if profile.xp >= 800:
        grant("monthly_champion")
    if profile.xp >= 500:
        grant("top_citizen")
    if action_counts.get("complaint_submitted", 0) >= 5:
        grant("eco_guardian")
    if action_counts.get("complaint_resolved", 0) >= 1:
        grant("waste_warrior")
    if action_counts.get("volunteer_event", 0) >= 3:
        grant("green_ambassador")
    if profile.level >= 10:
        grant("community_leader")

    return unlocked


def _mission_progress(db: Session, profile: PlayerProfile, action: str) -> None:
    missions = db.query(Mission).filter(Mission.active.is_(True), Mission.action_key == action).all()
    for m in missions:
        pk = period_key(m.period.value)
        prog = (
            db.query(MissionProgress)
            .filter(
                MissionProgress.user_id == profile.user_id,
                MissionProgress.mission_id == m.id,
                MissionProgress.period_key == pk,
            )
            .first()
        )
        if not prog:
            prog = MissionProgress(
                user_id=profile.user_id,
                mission_id=m.id,
                period_key=pk,
                progress=0,
            )
            db.add(prog)
            db.flush()
        if prog.completed:
            continue
        prog.progress += 1
        if prog.progress >= m.target_count:
            prog.completed = True
            prog.completed_at = datetime.utcnow()
            profile.xp += m.reward_xp
            profile.points += m.reward_xp // 2
            _notify(
                db,
                profile.user_id,
                "Mission completed",
                f"{m.title} (+{m.reward_xp} XP)",
                "mission",
            )


def award(
    db: Session,
    user_id: int,
    name: str,
    role: str,
    ward: str,
    action: str,
    ref_type: str = "",
    ref_id: str = "",
    note: str = "",
) -> AwardResult:
    if action not in ACTION_REWARDS and action not in ("daily_login",):
        return AwardResult(awarded=False, message=f"Unknown action: {action}")

    profile = ensure_profile(db, user_id, name, role, ward)
    rewards = ACTION_REWARDS.get(action, {"xp": 0, "points": 0})

    # Daily login + streaks
    if action == "daily_login":
        today = date.today()
        if profile.last_login_date == today:
            return AwardResult(
                awarded=False,
                level=profile.level,
                tier=profile.tier.value,
                message="Already claimed daily login today",
            )
        if profile.last_login_date == yesterday(today):
            profile.daily_streak += 1
        else:
            profile.daily_streak = 1
        profile.last_login_date = today
        # weekly streak bump every 7 daily
        if profile.daily_streak > 0 and profile.daily_streak % 7 == 0:
            profile.weekly_streak += 1
            bonus = ACTION_REWARDS["weekly_streak"]
            profile.xp += bonus["xp"]
            profile.points += bonus["points"]
            _notify(
                db,
                user_id,
                "Weekly streak!",
                f"+{bonus['xp']} XP for {profile.daily_streak}-day streak",
                "xp",
            )

    # Idempotency check before insert
    existing = (
        db.query(XpLedger)
        .filter(
            XpLedger.user_id == user_id,
            XpLedger.action == action,
            XpLedger.ref_type == (ref_type or action),
            XpLedger.ref_id == (ref_id or period_key("daily")),
        )
        .first()
    )
    if existing:
        return AwardResult(
            awarded=False,
            level=profile.level,
            tier=profile.tier.value,
            message="Reward already granted for this event",
        )

    ledger = XpLedger(
        user_id=user_id,
        action=action,
        xp_delta=rewards["xp"],
        points_delta=rewards["points"],
        ref_type=ref_type or action,
        ref_id=ref_id or period_key("daily"),
        note=note,
    )
    db.add(ledger)

    profile.xp += rewards["xp"]
    profile.points += rewards["points"]
    _bump_ward(db, profile.ward, rewards["xp"])
    _mission_progress(db, profile, action)
    new_badges = _try_badges(db, profile)
    _recalc(profile)

    if rewards["xp"]:
        _notify(
            db,
            user_id,
            f"+{rewards['xp']} XP",
            note or action.replace("_", " ").title(),
            "xp",
        )

    db.commit()
    db.refresh(profile)
    return AwardResult(
        awarded=True,
        xp_gained=rewards["xp"],
        points_gained=rewards["points"],
        level=profile.level,
        tier=profile.tier.value,
        new_badges=new_badges,
        message="Awarded",
    )


def redeem(db: Session, profile: PlayerProfile, item_code: str) -> Redemption:
    item = db.query(RewardItem).filter(RewardItem.code == item_code, RewardItem.active.is_(True)).first()
    if not item:
        raise ValueError("Item not found")
    if item.stock <= 0:
        raise ValueError("Out of stock")
    if profile.points < item.cost_points:
        raise ValueError("Not enough points")
    profile.points -= item.cost_points
    item.stock -= 1
    code = f"RWD-{profile.user_id}-{item.code.upper()}-{int(datetime.utcnow().timestamp())}"
    row = Redemption(user_id=profile.user_id, item_id=item.id, code_issued=code)
    db.add(row)
    _notify(
        db,
        profile.user_id,
        "Reward redeemed",
        f"{item.name} — code {code}",
        "reward",
    )
    db.commit()
    db.refresh(row)
    return row


def xp_to_next(profile: PlayerProfile) -> int:
    nxt = xp_for_level(profile.level + 1)
    return max(0, nxt - profile.xp)
