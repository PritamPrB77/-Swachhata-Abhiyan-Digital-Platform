"""Seed demo users on startup."""
from app.database import Base, SessionLocal, engine
from app.models import User, UserRole
from app.security import hash_password


DEMO_USERS = [
    ("citizen@example.com", "Citizen Demo", "citizen123", UserRole.citizen, "Ward-1"),
    ("driver@example.com", "Driver Demo", "driver123", UserRole.driver, "Ward-1"),
    ("officer@example.com", "Officer Demo", "officer123", UserRole.officer, "Ward-1"),
    ("admin@example.com", "Admin Demo", "admin123", UserRole.admin, "City"),
]


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        for email, name, password, role, ward in DEMO_USERS:
            if db.query(User).filter(User.email == email).first():
                continue
            db.add(
                User(
                    email=email,
                    full_name=name,
                    hashed_password=hash_password(password),
                    role=role,
                    ward=ward,
                    phone="",
                )
            )
        db.commit()
        print("Auth seed complete")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
