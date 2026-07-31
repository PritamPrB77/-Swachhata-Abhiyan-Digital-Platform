import asyncio
import json
from datetime import datetime

from fastapi import Depends, FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.database import Base, engine, get_db
from app.models import LocationPing, Vehicle
from app.redis_bus import CHANNEL, get_all_latest, get_redis, publish_location
from app.schemas import LiveVehicle, LocationUpdate, VehicleCreate, VehicleOut
from app.security import TokenUser, decode_token, get_current_user

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Swachhata Fleet Service", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok", "service": "fleet"}


@app.get("/vehicles", response_model=list[VehicleOut])
def list_vehicles(db: Session = Depends(get_db), user: TokenUser = Depends(get_current_user)):
    q = db.query(Vehicle).filter(Vehicle.active.is_(True))
    if user.role == "driver":
        q = q.filter(Vehicle.driver_user_id == user.id)
    return q.order_by(Vehicle.id).all()


@app.post("/vehicles", response_model=VehicleOut)
def create_vehicle(
    payload: VehicleCreate,
    db: Session = Depends(get_db),
    user: TokenUser = Depends(get_current_user),
):
    if user.role not in ("officer", "admin"):
        raise HTTPException(status_code=403, detail="Forbidden")
    v = Vehicle(**payload.model_dump())
    db.add(v)
    db.commit()
    db.refresh(v)
    return v


@app.post("/vehicles/{vehicle_id}/assign")
def assign_driver(
    vehicle_id: int,
    driver_user_id: int,
    db: Session = Depends(get_db),
    user: TokenUser = Depends(get_current_user),
):
    if user.role not in ("officer", "admin"):
        raise HTTPException(status_code=403, detail="Forbidden")
    v = db.get(Vehicle, vehicle_id)
    if not v:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    v.driver_user_id = driver_user_id
    db.commit()
    return {"ok": True}


def _resolve_vehicle(db: Session, user: TokenUser, vehicle_id: int | None) -> Vehicle:
    if vehicle_id:
        v = db.get(Vehicle, vehicle_id)
    else:
        v = db.query(Vehicle).filter(Vehicle.driver_user_id == user.id, Vehicle.active.is_(True)).first()
    if not v:
        raise HTTPException(status_code=404, detail="No vehicle assigned to driver")
    if user.role == "driver" and v.driver_user_id != user.id:
        raise HTTPException(status_code=403, detail="Not your vehicle")
    return v


@app.post("/location")
def post_location(
    payload: LocationUpdate,
    db: Session = Depends(get_db),
    user: TokenUser = Depends(get_current_user),
):
    if user.role not in ("driver", "officer", "admin"):
        raise HTTPException(status_code=403, detail="Only drivers can share GPS")
    vehicle = _resolve_vehicle(db, user, payload.vehicle_id)
    ping = LocationPing(
        vehicle_id=vehicle.id,
        driver_user_id=user.id,
        latitude=payload.latitude,
        longitude=payload.longitude,
        speed=payload.speed,
        heading=payload.heading,
    )
    db.add(ping)
    db.commit()

    live = {
        "vehicle_id": vehicle.id,
        "plate_number": vehicle.plate_number,
        "label": vehicle.label,
        "ward": vehicle.ward,
        "driver_user_id": user.id,
        "driver_name": user.full_name,
        "latitude": payload.latitude,
        "longitude": payload.longitude,
        "speed": payload.speed,
        "heading": payload.heading,
        "updated_at": datetime.utcnow().isoformat() + "Z",
    }
    publish_location(live)
    return {"ok": True, "live": live}


@app.get("/live", response_model=list[LiveVehicle])
def live_locations(user: TokenUser = Depends(get_current_user)):
    # All authenticated roles can view live fleet (citizens, drivers, officers, admin)
    return get_all_latest()


@app.websocket("/ws/fleet")
async def ws_fleet(websocket: WebSocket):
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=4401)
        return
    try:
        user = decode_token(token)
    except HTTPException:
        await websocket.close(code=4401)
        return

    await websocket.accept()

    # Send current snapshot — all roles see all vehicles (drivers still see everyone live)
    for item in get_all_latest():
        await websocket.send_json({"type": "location", "data": item})

    r = get_redis()
    pubsub = r.pubsub(ignore_subscribe_messages=True)
    pubsub.subscribe(CHANNEL)

    try:
        while True:
            # Driver may also send location over the same socket
            try:
                message = await asyncio.wait_for(websocket.receive_text(), timeout=0.05)
                if user.role in ("driver", "officer", "admin"):
                    data = json.loads(message)
                    if data.get("type") == "ping":
                        from app.database import SessionLocal

                        db = SessionLocal()
                        try:
                            vehicle = _resolve_vehicle(db, user, data.get("vehicle_id"))
                            ping = LocationPing(
                                vehicle_id=vehicle.id,
                                driver_user_id=user.id,
                                latitude=float(data["latitude"]),
                                longitude=float(data["longitude"]),
                                speed=float(data.get("speed", 0)),
                                heading=float(data.get("heading", 0)),
                            )
                            db.add(ping)
                            db.commit()
                            live = {
                                "vehicle_id": vehicle.id,
                                "plate_number": vehicle.plate_number,
                                "label": vehicle.label,
                                "ward": vehicle.ward,
                                "driver_user_id": user.id,
                                "driver_name": user.full_name,
                                "latitude": float(data["latitude"]),
                                "longitude": float(data["longitude"]),
                                "speed": float(data.get("speed", 0)),
                                "heading": float(data.get("heading", 0)),
                                "updated_at": datetime.utcnow().isoformat() + "Z",
                            }
                            publish_location(live)
                            await websocket.send_json({"type": "ack", "data": live})
                        finally:
                            db.close()
            except asyncio.TimeoutError:
                pass
            except WebSocketDisconnect:
                break

            msg = pubsub.get_message(timeout=0.01)
            if msg and msg.get("type") == "message":
                payload = json.loads(msg["data"])
                await websocket.send_json({"type": "location", "data": payload})

            await asyncio.sleep(0.05)
    except WebSocketDisconnect:
        pass
    finally:
        pubsub.unsubscribe(CHANNEL)
        pubsub.close()
