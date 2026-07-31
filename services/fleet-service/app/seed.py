from app.database import Base, SessionLocal, engine
from app.models import Vehicle


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.query(Vehicle).count() == 0:
            # driver demo user id is typically 2 after auth seed order
            db.add(
                Vehicle(
                    plate_number="MH-12-AB-1234",
                    label="Waste Truck 1",
                    ward="Ward-1",
                    driver_user_id=2,
                    active=True,
                )
            )
            db.add(
                Vehicle(
                    plate_number="MH-12-CD-5678",
                    label="Waste Truck 2",
                    ward="Ward-2",
                    driver_user_id=None,
                    active=True,
                )
            )
            db.commit()
            print("Fleet seed complete")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
