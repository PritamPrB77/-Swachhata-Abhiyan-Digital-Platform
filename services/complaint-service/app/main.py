from fastapi import Depends, FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database import Base, engine, get_db
from app.models import Complaint, ComplaintComment, ComplaintStatus
from app.schemas import (
    AnalyzeRequest,
    CommentCreate,
    CommentOut,
    ComplaintCreate,
    ComplaintOut,
    ComplaintUpdate,
    StatsOut,
)
from app.security import TokenUser, get_current_user
from app.sentiment import analyze_text
from app.storage import public_url, upload_image

Base.metadata.create_all(bind=engine)


def _ensure_columns():
    alters = [
        "ALTER TABLE complaints ADD COLUMN IF NOT EXISTS photo_latitude DOUBLE PRECISION",
        "ALTER TABLE complaints ADD COLUMN IF NOT EXISTS photo_longitude DOUBLE PRECISION",
        "ALTER TABLE complaints ADD COLUMN IF NOT EXISTS urgency VARCHAR(20) DEFAULT 'medium'",
        "ALTER TABLE complaints ADD COLUMN IF NOT EXISTS sentiment_score DOUBLE PRECISION DEFAULT 0",
        "ALTER TABLE complaints ADD COLUMN IF NOT EXISTS sentiment_label VARCHAR(40) DEFAULT 'neutral'",
        "ALTER TABLE complaints ADD COLUMN IF NOT EXISTS officer_notes TEXT DEFAULT ''",
    ]
    with engine.begin() as conn:
        for stmt in alters:
            conn.execute(text(stmt))


_ensure_columns()

app = FastAPI(title="Swachhata Complaint Service", version="1.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def to_out(c: Complaint) -> ComplaintOut:
    data = ComplaintOut.model_validate(c)
    data.image_url = public_url(c.image_key)
    return data


@app.get("/health")
def health():
    return {"status": "ok", "service": "complaint"}


@app.post("/analyze")
def analyze(payload: AnalyzeRequest, _: TokenUser = Depends(get_current_user)):
    return analyze_text(payload.text)


@app.get("/stats", response_model=StatsOut)
def stats(db: Session = Depends(get_db), user: TokenUser = Depends(get_current_user)):
    q = db.query(Complaint)
    if user.role == "citizen":
        q = q.filter(Complaint.citizen_id == user.id)
    rows = q.all()
    return StatsOut(
        total=len(rows),
        pending=sum(1 for r in rows if r.status in (ComplaintStatus.submitted, ComplaintStatus.assigned)),
        in_progress=sum(1 for r in rows if r.status == ComplaintStatus.in_progress),
        resolved=sum(1 for r in rows if r.status == ComplaintStatus.resolved),
        critical=sum(1 for r in rows if (r.urgency or "") == "critical"),
        high=sum(1 for r in rows if (r.urgency or "") == "high"),
    )


@app.post("/upload")
async def upload(file: UploadFile = File(...), user: TokenUser = Depends(get_current_user)):
    content = await file.read()
    if len(content) > 20 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large")
    key = upload_image(content, file.content_type or "image/jpeg", file.filename or "photo.jpg")
    return {"image_key": key, "image_url": public_url(key)}


@app.post("/", response_model=ComplaintOut)
def create_complaint(
    payload: ComplaintCreate,
    db: Session = Depends(get_db),
    user: TokenUser = Depends(get_current_user),
):
    if user.role not in ("citizen", "driver"):
        raise HTTPException(status_code=403, detail="Only citizens and field workers can file complaints")

    analysis = analyze_text(payload.description)
    urgency = payload.urgency or analysis["urgency"]
    sentiment_score = (
        payload.sentiment_score if payload.sentiment_score is not None else analysis["sentiment_score"]
    )
    sentiment_label = payload.sentiment_label or analysis["sentiment_label"]

    complaint = Complaint(
        citizen_id=user.id,
        citizen_name=user.full_name,
        category=payload.category,
        description=payload.description,
        latitude=payload.latitude,
        longitude=payload.longitude,
        photo_latitude=payload.photo_latitude if payload.photo_latitude is not None else payload.latitude,
        photo_longitude=payload.photo_longitude if payload.photo_longitude is not None else payload.longitude,
        ward=payload.ward or user.ward,
        image_key=payload.image_key,
        urgency=urgency,
        sentiment_score=float(sentiment_score),
        sentiment_label=sentiment_label,
        status=ComplaintStatus.submitted,
    )
    db.add(complaint)
    db.commit()
    db.refresh(complaint)
    return to_out(complaint)


@app.get("/", response_model=list[ComplaintOut])
def list_complaints(
    db: Session = Depends(get_db),
    user: TokenUser = Depends(get_current_user),
):
    q = db.query(Complaint)
    if user.role == "citizen":
        q = q.filter(Complaint.citizen_id == user.id)
    elif user.role == "driver":
        q = q.filter(
            (Complaint.assignee_id == user.id) | (Complaint.status == ComplaintStatus.submitted)
        )
    # officer/admin see all
    items = q.order_by(Complaint.created_at.desc()).limit(300).all()
    # Sort critical first for reviewers
    if user.role in ("officer", "admin"):
        order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
        items = sorted(items, key=lambda c: (order.get(c.urgency or "medium", 9), -c.id))
    return [to_out(c) for c in items]


@app.get("/{complaint_id}", response_model=ComplaintOut)
def get_complaint(
    complaint_id: int,
    db: Session = Depends(get_db),
    user: TokenUser = Depends(get_current_user),
):
    c = db.get(Complaint, complaint_id)
    if not c:
        raise HTTPException(status_code=404, detail="Not found")
    if user.role == "citizen" and c.citizen_id != user.id:
        raise HTTPException(status_code=403, detail="Forbidden")
    return to_out(c)


@app.patch("/{complaint_id}", response_model=ComplaintOut)
def update_complaint(
    complaint_id: int,
    payload: ComplaintUpdate,
    db: Session = Depends(get_db),
    user: TokenUser = Depends(get_current_user),
):
    if user.role not in ("driver", "officer", "admin"):
        raise HTTPException(status_code=403, detail="Forbidden")
    c = db.get(Complaint, complaint_id)
    if not c:
        raise HTTPException(status_code=404, detail="Not found")
    if payload.status is not None:
        c.status = payload.status
    if payload.assignee_id is not None:
        c.assignee_id = payload.assignee_id
    if payload.assignee_name is not None:
        c.assignee_name = payload.assignee_name
    if payload.officer_notes is not None:
        c.officer_notes = payload.officer_notes
    if payload.urgency is not None and user.role in ("officer", "admin"):
        c.urgency = payload.urgency
    if payload.status == ComplaintStatus.assigned and not c.assignee_id:
        c.assignee_id = user.id
        c.assignee_name = user.full_name
    db.commit()
    db.refresh(c)
    return to_out(c)


@app.get("/{complaint_id}/comments", response_model=list[CommentOut])
def list_comments(
    complaint_id: int,
    db: Session = Depends(get_db),
    user: TokenUser = Depends(get_current_user),
):
    c = db.get(Complaint, complaint_id)
    if not c:
        raise HTTPException(status_code=404, detail="Not found")
    if user.role == "citizen" and c.citizen_id != user.id:
        raise HTTPException(status_code=403, detail="Forbidden")
    return (
        db.query(ComplaintComment)
        .filter(ComplaintComment.complaint_id == complaint_id)
        .order_by(ComplaintComment.created_at)
        .all()
    )


@app.post("/{complaint_id}/comments", response_model=CommentOut)
def add_comment(
    complaint_id: int,
    payload: CommentCreate,
    db: Session = Depends(get_db),
    user: TokenUser = Depends(get_current_user),
):
    c = db.get(Complaint, complaint_id)
    if not c:
        raise HTTPException(status_code=404, detail="Not found")
    if user.role == "citizen" and c.citizen_id != user.id:
        raise HTTPException(status_code=403, detail="Forbidden")
    analysis = analyze_text(payload.body)
    # Escalate urgency if comment is more severe
    if analysis["urgency"] in ("high", "critical"):
        rank = {"low": 0, "medium": 1, "high": 2, "critical": 3}
        if rank.get(analysis["urgency"], 0) > rank.get(c.urgency or "medium", 1):
            c.urgency = analysis["urgency"]
    row = ComplaintComment(
        complaint_id=complaint_id,
        user_id=user.id,
        user_name=user.full_name,
        role=user.role,
        body=payload.body,
        sentiment_score=analysis["sentiment_score"],
        sentiment_label=analysis["sentiment_label"],
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row
