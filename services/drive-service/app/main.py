import uuid

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.database import Base, engine, get_db
from app.models import DriveEvent, DriveStatus, VolunteerSignup
from app.schemas import DriveCreate, DriveOut, SignupOut
from app.security import TokenUser, get_current_user

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Swachhata Drive Service", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def with_count(db: Session, event: DriveEvent) -> DriveOut:
    count = db.query(VolunteerSignup).filter(VolunteerSignup.event_id == event.id).count()
    out = DriveOut.model_validate(event)
    out.signup_count = count
    return out


@app.get("/health")
def health():
    return {"status": "ok", "service": "drive"}


@app.get("/", response_model=list[DriveOut])
def list_drives(db: Session = Depends(get_db), _: TokenUser = Depends(get_current_user)):
    events = db.query(DriveEvent).order_by(DriveEvent.starts_at.desc()).all()
    return [with_count(db, e) for e in events]


@app.get("/me/signups", response_model=list[SignupOut])
def my_signups(db: Session = Depends(get_db), user: TokenUser = Depends(get_current_user)):
    return (
        db.query(VolunteerSignup)
        .filter(VolunteerSignup.user_id == user.id)
        .order_by(VolunteerSignup.created_at.desc())
        .all()
    )


@app.post("/", response_model=DriveOut)
def create_drive(
    payload: DriveCreate,
    db: Session = Depends(get_db),
    user: TokenUser = Depends(get_current_user),
):
    if user.role not in ("officer", "admin"):
        raise HTTPException(status_code=403, detail="Forbidden")
    event = DriveEvent(**payload.model_dump(), created_by=user.id)
    db.add(event)
    db.commit()
    db.refresh(event)
    return with_count(db, event)


@app.post("/{event_id}/signup", response_model=SignupOut)
def signup(
    event_id: int,
    db: Session = Depends(get_db),
    user: TokenUser = Depends(get_current_user),
):
    event = db.get(DriveEvent, event_id)
    if not event or event.status == DriveStatus.cancelled:
        raise HTTPException(status_code=404, detail="Event not found")
    existing = (
        db.query(VolunteerSignup)
        .filter(VolunteerSignup.event_id == event_id, VolunteerSignup.user_id == user.id)
        .first()
    )
    if existing:
        return existing
    count = db.query(VolunteerSignup).filter(VolunteerSignup.event_id == event_id).count()
    if count >= event.capacity:
        raise HTTPException(status_code=400, detail="Event is full")
    signup_row = VolunteerSignup(
        event_id=event_id,
        user_id=user.id,
        user_name=user.full_name,
    )
    db.add(signup_row)
    db.commit()
    db.refresh(signup_row)
    return signup_row


@app.post("/{event_id}/attendance/{user_id}", response_model=SignupOut)
def mark_attendance(
    event_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    user: TokenUser = Depends(get_current_user),
):
    if user.role not in ("officer", "admin"):
        raise HTTPException(status_code=403, detail="Forbidden")
    row = (
        db.query(VolunteerSignup)
        .filter(VolunteerSignup.event_id == event_id, VolunteerSignup.user_id == user_id)
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="Signup not found")
    row.attended = True
    if not row.certificate_code:
        row.certificate_code = f"SWC-{uuid.uuid4().hex[:10].upper()}"
    db.commit()
    db.refresh(row)
    return row


@app.get("/{event_id}/signups", response_model=list[SignupOut])
def list_signups(
    event_id: int,
    db: Session = Depends(get_db),
    user: TokenUser = Depends(get_current_user),
):
    if user.role not in ("officer", "admin"):
        raise HTTPException(status_code=403, detail="Forbidden")
    return (
        db.query(VolunteerSignup)
        .filter(VolunteerSignup.event_id == event_id)
        .order_by(VolunteerSignup.created_at)
        .all()
    )
