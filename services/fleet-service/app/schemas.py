from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class VehicleCreate(BaseModel):
    plate_number: str
    label: str
    ward: str = "Ward-1"
    driver_user_id: Optional[int] = None


class VehicleOut(BaseModel):
    id: int
    plate_number: str
    label: str
    ward: str
    driver_user_id: Optional[int]
    active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class LocationUpdate(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    speed: float = 0.0
    heading: float = 0.0
    vehicle_id: Optional[int] = None


class LiveVehicle(BaseModel):
    vehicle_id: int
    plate_number: str
    label: str
    ward: str
    driver_user_id: Optional[int]
    driver_name: str = ""
    latitude: float
    longitude: float
    speed: float = 0.0
    heading: float = 0.0
    updated_at: str
