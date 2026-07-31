from datetime import datetime, timedelta

from app.database import Base, SessionLocal, engine
from app.models import DriveEvent, DriveStatus


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.query(DriveEvent).count() == 0:
            now = datetime.utcnow()
            db.add(
                DriveEvent(
                    title="Ward-1 Morning Cleanliness Drive",
                    description="Join neighbors to clean streets and parks.",
                    location="Central Park, Ward-1",
                    ward="Ward-1",
                    starts_at=now + timedelta(days=2),
                    ends_at=now + timedelta(days=2, hours=3),
                    capacity=40,
                    status=DriveStatus.upcoming,
                    created_by=3,
                )
            )
            db.commit()
            print("Drive seed complete")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
