from datetime import datetime, timedelta

from app.database import Base, SessionLocal, engine
from app.models import Badge, Challenge, Mission, MissionPeriod, RewardItem


BADGES = [
    ("first_complaint", "First Complaint", "Submit your first cleanliness complaint", "🥇", 25),
    ("cleanliness_hero", "Cleanliness Hero", "Help resolve 3 issues", "🦸", 75),
    ("volunteer_star", "Volunteer Star", "Join a cleanliness drive", "⭐", 50),
    ("weekly_warrior", "Weekly Warrior", "Maintain a 7-day login streak", "🔥", 60),
    ("monthly_champion", "Monthly Champion", "Reach Champion tier XP", "🏆", 100),
    ("top_citizen", "Top Citizen", "Earn 500 XP", "👑", 40),
    ("eco_guardian", "Eco Guardian", "Submit 5 complaints", "🌿", 80),
    ("waste_warrior", "Waste Warrior", "Resolve at least one issue", "♻️", 35),
    ("green_ambassador", "Green Ambassador", "Attend 3 volunteer events", "🌏", 90),
    ("community_leader", "Community Leader", "Reach level 10", "📣", 120),
]

MISSIONS = [
    ("daily_report", "Daily Report", "Submit 1 complaint today", MissionPeriod.daily, 1, 30, "complaint_submitted"),
    ("daily_login_mission", "Show Up", "Claim daily login", MissionPeriod.daily, 1, 10, "daily_login"),
    ("weekly_volunteer", "Weekend Helper", "Join 1 volunteer event this week", MissionPeriod.weekly, 1, 80, "volunteer_event"),
    ("weekly_reports", "Watchful Citizen", "Submit 3 complaints this week", MissionPeriod.weekly, 3, 100, "complaint_submitted"),
    ("monthly_resolver", "Problem Solver", "Resolve 2 issues this month", MissionPeriod.monthly, 2, 200, "complaint_resolved"),
]

STORE = [
    ("coupon_tea", "Municipal Canteen Coupon", "Free tea at ward office canteen", 40, "coupon", 200),
    ("cert_green", "Green Citizen Certificate", "Printable digital certificate", 80, "certificate", 100),
    ("badge_frame", "Golden Profile Frame", "Cosmetic digital badge frame", 60, "digital_badge", 150),
    ("coupon_sapling", "Free Sapling Coupon", "Collect a sapling from nursery", 120, "coupon", 50),
]


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.query(Badge).count() == 0:
            for code, name, desc, icon, bonus in BADGES:
                db.add(
                    Badge(code=code, name=name, description=desc, icon=icon, bonus_xp=bonus)
                )
        if db.query(Mission).count() == 0:
            for code, title, desc, period, target, xp, action in MISSIONS:
                db.add(
                    Mission(
                        code=code,
                        title=title,
                        description=desc,
                        period=period,
                        target_count=target,
                        reward_xp=xp,
                        action_key=action,
                    )
                )
        if db.query(RewardItem).count() == 0:
            for code, name, desc, cost, typ, stock in STORE:
                db.add(
                    RewardItem(
                        code=code,
                        name=name,
                        description=desc,
                        cost_points=cost,
                        item_type=typ,
                        stock=stock,
                    )
                )
        if db.query(Challenge).count() == 0:
            now = datetime.utcnow()
            db.add(
                Challenge(
                    code="clean_march",
                    title="Community Clean March",
                    description="City-wide challenge: earn XP via complaints & drives this month.",
                    scope="community",
                    reward_xp=200,
                    starts_at=now - timedelta(days=1),
                    ends_at=now + timedelta(days=25),
                )
            )
            db.add(
                Challenge(
                    code="ward_pride",
                    title="Ward Pride Week",
                    description="Compete to make your ward the cleanest.",
                    scope="ward",
                    reward_xp=150,
                    starts_at=now - timedelta(days=1),
                    ends_at=now + timedelta(days=7),
                )
            )
        db.commit()
        print("Gamification seed complete")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
