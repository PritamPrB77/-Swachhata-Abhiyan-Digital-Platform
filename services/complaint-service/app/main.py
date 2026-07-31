from fastapi import Depends, FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.database import Base, engine, get_db
from app.models import Complaint, ComplaintStatus
from app.schemas import ComplaintCreate, ComplaintOut, ComplaintUpdate
from app.security import TokenUser, get_current_user
from app.storage import public_url, upload_image

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Swachhata Complaint Service", version="1.0.0")
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
    complaint = Complaint(
        citizen_id=user.id,
        citizen_name=user.full_name,
        category=payload.category,
        description=payload.description,
        latitude=payload.latitude,
        longitude=payload.longitude,
        ward=payload.ward or user.ward,
        image_key=payload.image_key,
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
    items = q.order_by(Complaint.created_at.desc()).limit(200).all()
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
    if payload.status == ComplaintStatus.assigned and not c.assignee_id:
        c.assignee_id = user.id
        c.assignee_name = user.full_name
    db.commit()
    db.refresh(c)
    return to_out(c)
