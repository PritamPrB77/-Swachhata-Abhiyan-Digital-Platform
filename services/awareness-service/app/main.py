from datetime import datetime

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database import Base, engine, get_db
from app.models import Campaign, Committee, EventRsvp, MicroEvent
from app.security import TokenUser, get_current_user

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Swachhata Awareness Service", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class CommitteeCreate(BaseModel):
    name: str
    ward: str = "Ward-1"
    description: str = ""


class CampaignCreate(BaseModel):
    title: str
    body: str = ""
    ward: str = "city"
    banner_url: str = ""


class MicroEventCreate(BaseModel):
    title: str
    description: str = ""
    ward: str = "Ward-1"
    starts_at: datetime
    ends_at: datetime
    committee_id: int = 0


@app.get("/health")
def health():
    return {"status": "ok", "service": "awareness"}


@app.get("/campaigns")
def list_campaigns(db: Session = Depends(get_db)):
    """Public campaign feed."""
    return (
        db.query(Campaign)
        .filter(Campaign.status == "published")
        .order_by(Campaign.created_at.desc())
        .limit(50)
        .all()
    )


@app.post("/campaigns")
def create_campaign(
    payload: CampaignCreate,
    db: Session = Depends(get_db),
    user: TokenUser = Depends(get_current_user),
):
    if user.role not in ("officer", "admin"):
        raise HTTPException(status_code=403, detail="Only officers can publish campaigns")
    row = Campaign(
        title=payload.title,
        body=payload.body,
        ward=payload.ward,
        banner_url=payload.banner_url,
        created_by=user.id,
        created_by_name=user.full_name,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@app.get("/committees")
def list_committees(db: Session = Depends(get_db), _: TokenUser = Depends(get_current_user)):
    return db.query(Committee).order_by(Committee.created_at.desc()).all()


@app.post("/committees")
def apply_committee(
    payload: CommitteeCreate,
    db: Session = Depends(get_db),
    user: TokenUser = Depends(get_current_user),
):
    row = Committee(
        name=payload.name,
        ward=payload.ward or user.ward,
        description=payload.description,
        status="pending",
        admin_user_id=user.id,
        admin_name=user.full_name,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@app.post("/committees/{committee_id}/approve")
def approve_committee(
    committee_id: int,
    db: Session = Depends(get_db),
    user: TokenUser = Depends(get_current_user),
):
    if user.role not in ("officer", "admin"):
        raise HTTPException(status_code=403, detail="Forbidden")
    row = db.get(Committee, committee_id)
    if not row:
        raise HTTPException(status_code=404, detail="Not found")
    row.status = "approved"
    db.commit()
    return row


@app.get("/calendar")
def calendar(ward: str = "", db: Session = Depends(get_db)):
    q = db.query(MicroEvent)
    if ward:
        q = q.filter(MicroEvent.ward == ward)
    return q.order_by(MicroEvent.starts_at.asc()).limit(100).all()


@app.post("/events")
def create_micro_event(
    payload: MicroEventCreate,
    db: Session = Depends(get_db),
    user: TokenUser = Depends(get_current_user),
):
    if user.role not in ("officer", "admin", "citizen", "driver"):
        raise HTTPException(status_code=403, detail="Forbidden")
    row = MicroEvent(
        title=payload.title,
        description=payload.description,
        ward=payload.ward or user.ward,
        starts_at=payload.starts_at,
        ends_at=payload.ends_at,
        committee_id=payload.committee_id,
        created_by=user.id,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@app.post("/events/{event_id}/rsvp")
def rsvp(
    event_id: int,
    db: Session = Depends(get_db),
    user: TokenUser = Depends(get_current_user),
):
    event = db.get(MicroEvent, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Not found")
    existing = (
        db.query(EventRsvp)
        .filter(EventRsvp.event_id == event_id, EventRsvp.user_id == user.id)
        .first()
    )
    if existing:
        return existing
    row = EventRsvp(event_id=event_id, user_id=user.id, user_name=user.full_name)
    event.rsvp_count += 1
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@app.get("/scorecard")
def ward_scorecard(db: Session = Depends(get_db)):
    """
    Transparent rule-based score (no AI):
    score = clamp(70 + approved_committees*5 + campaigns*2 + events*3, 0, 100)
    """
    wards = {c.ward for c in db.query(Committee).all()} | {e.ward for e in db.query(MicroEvent).all()} | {"Ward-1"}
    out = []
    for ward in sorted(wards):
        committees = (
            db.query(Committee)
            .filter(Committee.ward == ward, Committee.status == "approved")
            .count()
        )
        campaigns = db.query(Campaign).filter(Campaign.ward.in_([ward, "city"])).count()
        events = db.query(MicroEvent).filter(MicroEvent.ward == ward).count()
        score = max(0, min(100, 70 + committees * 5 + campaigns * 2 + events * 3))
        out.append(
            {
                "ward": ward,
                "score": score,
                "formula": "70 + approved_committees×5 + campaigns×2 + micro_events×3 (clamped 0–100)",
                "approved_committees": committees,
                "campaigns": campaigns,
                "micro_events": events,
            }
        )
    return out
