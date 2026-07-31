from datetime import datetime, timedelta

from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.database import Base, engine, get_db
from app.engine import award, ensure_profile, redeem, xp_to_next
from app.models import (
    Badge,
    Challenge,
    GameNotification,
    Mission,
    MissionProgress,
    PlayerProfile,
    RewardItem,
    UserBadge,
    WalletPayout,
    WardScore,
)
from app.rules import period_key
from app.schemas import (
    AwardRequest,
    AwardResult,
    BadgeOut,
    ChallengeOut,
    LeaderboardEntry,
    MissionOut,
    NotificationOut,
    ProfileOut,
    RedeemRequest,
    RewardItemOut,
    WardLeaderboardEntry,
)
from app.security import TokenUser, get_current_user

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Swachhata Gamification Service", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok", "service": "gamification"}


def profile_out(db: Session, p: PlayerProfile) -> ProfileOut:
    badges_count = db.query(UserBadge).filter(UserBadge.user_id == p.user_id).count()
    return ProfileOut(
        user_id=p.user_id,
        display_name=p.display_name,
        role=p.role,
        ward=p.ward,
        xp=p.xp,
        points=p.points,
        level=p.level,
        tier=p.tier.value,
        daily_streak=p.daily_streak,
        weekly_streak=p.weekly_streak,
        xp_to_next_level=xp_to_next(p),
        badges_count=badges_count,
    )


def require_reward_role(user: TokenUser = Depends(get_current_user)) -> TokenUser:
    if user.role not in ("citizen", "driver"):
        raise HTTPException(
            status_code=403,
            detail="Rewards are only for citizens and field workers/drivers",
        )
    return user


@app.get("/me", response_model=ProfileOut)
def my_profile(db: Session = Depends(get_db), user: TokenUser = Depends(require_reward_role)):
    p = ensure_profile(db, user.id, user.full_name, user.role, user.ward)
    db.commit()
    return profile_out(db, p)


@app.post("/award", response_model=AwardResult)
def award_xp(
    payload: AwardRequest,
    db: Session = Depends(get_db),
    user: TokenUser = Depends(require_reward_role),
):
    return award(
        db,
        user.id,
        user.full_name,
        user.role,
        user.ward,
        payload.action,
        payload.ref_type,
        payload.ref_id,
        payload.note,
    )


@app.post("/checkin", response_model=AwardResult)
def daily_checkin(db: Session = Depends(get_db), user: TokenUser = Depends(require_reward_role)):
    return award(
        db,
        user.id,
        user.full_name,
        user.role,
        user.ward,
        "daily_login",
        "login",
        period_key("daily"),
        "Daily login bonus",
    )


@app.get("/badges", response_model=list[BadgeOut])
def list_badges(db: Session = Depends(get_db), user: TokenUser = Depends(require_reward_role)):
    earned = {
        ub.badge_id: ub.earned_at
        for ub in db.query(UserBadge).filter(UserBadge.user_id == user.id).all()
    }
    out = []
    for b in db.query(Badge).order_by(Badge.id).all():
        out.append(
            BadgeOut(
                code=b.code,
                name=b.name,
                description=b.description,
                icon=b.icon,
                bonus_xp=b.bonus_xp,
                earned=b.id in earned,
                earned_at=earned.get(b.id),
            )
        )
    return out


@app.get("/missions", response_model=list[MissionOut])
def list_missions(db: Session = Depends(get_db), user: TokenUser = Depends(require_reward_role)):
    missions = db.query(Mission).filter(Mission.active.is_(True)).all()
    result = []
    for m in missions:
        pk = period_key(m.period.value)
        prog = (
            db.query(MissionProgress)
            .filter(
                MissionProgress.user_id == user.id,
                MissionProgress.mission_id == m.id,
                MissionProgress.period_key == pk,
            )
            .first()
        )
        result.append(
            MissionOut(
                code=m.code,
                title=m.title,
                description=m.description,
                period=m.period.value,
                target_count=m.target_count,
                reward_xp=m.reward_xp,
                progress=prog.progress if prog else 0,
                completed=prog.completed if prog else False,
            )
        )
    return result


@app.get("/challenges", response_model=list[ChallengeOut])
def list_challenges(db: Session = Depends(get_db), _: TokenUser = Depends(require_reward_role)):
    now = datetime.utcnow()
    rows = (
        db.query(Challenge)
        .filter(Challenge.active.is_(True), Challenge.ends_at >= now - timedelta(days=1))
        .order_by(Challenge.ends_at)
        .all()
    )
    return [
        ChallengeOut(
            code=c.code,
            title=c.title,
            description=c.description,
            scope=c.scope,
            reward_xp=c.reward_xp,
            starts_at=c.starts_at,
            ends_at=c.ends_at,
            active=c.active,
        )
        for c in rows
    ]


@app.get("/store", response_model=list[RewardItemOut])
def store(db: Session = Depends(get_db), _: TokenUser = Depends(require_reward_role)):
    items = db.query(RewardItem).filter(RewardItem.active.is_(True)).order_by(RewardItem.cost_points).all()
    return [
        RewardItemOut(
            id=i.id,
            code=i.code,
            name=i.name,
            description=i.description,
            cost_points=i.cost_points,
            item_type=i.item_type,
            stock=i.stock,
        )
        for i in items
    ]


@app.post("/store/redeem")
def redeem_item(
    payload: RedeemRequest,
    db: Session = Depends(get_db),
    user: TokenUser = Depends(require_reward_role),
):
    p = ensure_profile(db, user.id, user.full_name, user.role, user.ward)
    try:
        row = redeem(db, p, payload.item_code)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"ok": True, "code_issued": row.code_issued}


@app.get("/leaderboard", response_model=list[LeaderboardEntry])
def leaderboard(
    scope: str = Query("city", pattern="^(city|ward|role)$"),
    role: str | None = None,
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    user: TokenUser = Depends(require_reward_role),
):
    q = db.query(PlayerProfile)
    if scope == "ward":
        q = q.filter(PlayerProfile.ward == user.ward)
    if scope == "role" and role:
        q = q.filter(PlayerProfile.role == role)
    elif scope == "role":
        q = q.filter(PlayerProfile.role == user.role)
    rows = q.order_by(PlayerProfile.xp.desc()).limit(limit).all()
    return [
        LeaderboardEntry(
            rank=i + 1,
            user_id=r.user_id,
            display_name=r.display_name,
            role=r.role,
            ward=r.ward,
            xp=r.xp,
            level=r.level,
            tier=r.tier.value,
        )
        for i, r in enumerate(rows)
    ]


@app.get("/leaderboard/wards", response_model=list[WardLeaderboardEntry])
def ward_leaderboard(
    db: Session = Depends(get_db),
    _: TokenUser = Depends(require_reward_role),
):
    rows = db.query(WardScore).order_by(WardScore.total_xp.desc()).limit(50).all()
    return [
        WardLeaderboardEntry(
            rank=i + 1,
            ward=r.ward,
            total_xp=r.total_xp,
            citizen_count=r.citizen_count,
            cleanliness_score=r.cleanliness_score,
        )
        for i, r in enumerate(rows)
    ]


@app.get("/notifications", response_model=list[NotificationOut])
def notifications(
    db: Session = Depends(get_db),
    user: TokenUser = Depends(require_reward_role),
):
    return (
        db.query(GameNotification)
        .filter(GameNotification.user_id == user.id)
        .order_by(GameNotification.created_at.desc())
        .limit(50)
        .all()
    )


@app.post("/notifications/read-all")
def read_all(db: Session = Depends(get_db), user: TokenUser = Depends(require_reward_role)):
    db.query(GameNotification).filter(
        GameNotification.user_id == user.id, GameNotification.read.is_(False)
    ).update({"read": True})
    db.commit()
    return {"ok": True}


# --- Real-money wallet (stub payout partner — never custodial) ---
POINTS_PER_RUPEE = 10
MIN_REDEEM_POINTS = 100


@app.get("/wallet/config")
def wallet_config(_: TokenUser = Depends(require_reward_role)):
    return {
        "points_per_rupee": POINTS_PER_RUPEE,
        "min_redeem_points": MIN_REDEEM_POINTS,
        "provider": "stub-payout-partner",
        "note": "Demo only — swap stub for Razorpay/Cashfree Payouts in production.",
    }


@app.get("/wallet/ledger")
def wallet_ledger(db: Session = Depends(get_db), user: TokenUser = Depends(require_reward_role)):
    rows = (
        db.query(WalletPayout)
        .filter(WalletPayout.user_id == user.id)
        .order_by(WalletPayout.created_at.desc())
        .limit(50)
        .all()
    )
    return [
        {
            "id": r.id,
            "kind": r.kind,
            "points": r.points,
            "inr_amount": r.inr_amount,
            "status": r.status,
            "provider_ref": r.provider_ref,
            "created_at": r.created_at.isoformat() + "Z",
        }
        for r in rows
    ]


@app.post("/wallet/redeem")
def wallet_redeem(
    payload: dict,
    db: Session = Depends(get_db),
    user: TokenUser = Depends(require_reward_role),
):
    import uuid

    points = int(payload.get("points") or 0)
    upi_id = str(payload.get("upi_id") or "").strip()
    if points < MIN_REDEEM_POINTS:
        raise HTTPException(status_code=400, detail=f"Minimum redeem is {MIN_REDEEM_POINTS} points")
    if not upi_id or "@" not in upi_id:
        raise HTTPException(status_code=400, detail="Valid UPI ID required")

    profile = db.get(PlayerProfile, user.id)
    if not profile or profile.points < points:
        raise HTTPException(status_code=400, detail="Insufficient points")

    inr = round(points / POINTS_PER_RUPEE, 2)
    # Stub partner payout — records provider_ref as if Razorpay/Cashfree succeeded
    provider_ref = f"stub_payout_{uuid.uuid4().hex[:12]}"
    profile.points -= points
    row = WalletPayout(
        user_id=user.id,
        kind="redeem",
        points=points,
        inr_amount=inr,
        upi_id=upi_id,
        status="completed",
        provider_ref=provider_ref,
        note="Stub partner payout (demo)",
    )
    db.add(row)
    db.add(
        GameNotification(
            user_id=user.id,
            title="Payout completed",
            body=f"₹{inr} sent to {upi_id} (ref {provider_ref})",
            kind="reward",
        )
    )
    db.commit()
    return {"status": row.status, "inr_amount": inr, "provider_ref": provider_ref, "points": points}
