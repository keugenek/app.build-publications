from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime, date
from typing import Optional, List
from decimal import Decimal


# Persistent models (stored in database)
class Car(SQLModel, table=True):
    __tablename__ = "cars"  # type: ignore[assignment]

    id: Optional[int] = Field(default=None, primary_key=True)
    make: str = Field(max_length=100)
    model: str = Field(max_length=100)
    year: int = Field(ge=1900, le=2100)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    maintenance_records: List["MaintenanceRecord"] = Relationship(back_populates="car")
    service_schedules: List["ServiceSchedule"] = Relationship(back_populates="car")


class MaintenanceRecord(SQLModel, table=True):
    __tablename__ = "maintenance_records"  # type: ignore[assignment]

    id: Optional[int] = Field(default=None, primary_key=True)
    car_id: int = Field(foreign_key="cars.id")
    service_date: date
    service_type: str = Field(max_length=200)
    cost: Decimal = Field(decimal_places=2, max_digits=10)
    mileage: int = Field(ge=0)
    notes: str = Field(default="", max_length=1000)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    car: Car = Relationship(back_populates="maintenance_records")


class ServiceSchedule(SQLModel, table=True):
    __tablename__ = "service_schedules"  # type: ignore[assignment]

    id: Optional[int] = Field(default=None, primary_key=True)
    car_id: int = Field(foreign_key="cars.id")
    next_service_date: date
    next_service_mileage: int = Field(ge=0)
    service_type: str = Field(max_length=200)
    notes: str = Field(default="", max_length=1000)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    car: Car = Relationship(back_populates="service_schedules")


# Non-persistent schemas (for validation, forms, API requests/responses)
class CarCreate(SQLModel, table=False):
    make: str = Field(max_length=100)
    model: str = Field(max_length=100)
    year: int = Field(ge=1900, le=2100)


class CarUpdate(SQLModel, table=False):
    make: Optional[str] = Field(default=None, max_length=100)
    model: Optional[str] = Field(default=None, max_length=100)
    year: Optional[int] = Field(default=None, ge=1900, le=2100)


class MaintenanceRecordCreate(SQLModel, table=False):
    car_id: int
    service_date: date
    service_type: str = Field(max_length=200)
    cost: Decimal = Field(decimal_places=2, max_digits=10)
    mileage: int = Field(ge=0)
    notes: str = Field(default="", max_length=1000)


class MaintenanceRecordUpdate(SQLModel, table=False):
    service_date: Optional[date] = Field(default=None)
    service_type: Optional[str] = Field(default=None, max_length=200)
    cost: Optional[Decimal] = Field(default=None, decimal_places=2, max_digits=10)
    mileage: Optional[int] = Field(default=None, ge=0)
    notes: Optional[str] = Field(default=None, max_length=1000)


class ServiceScheduleCreate(SQLModel, table=False):
    car_id: int
    next_service_date: date
    next_service_mileage: int = Field(ge=0)
    service_type: str = Field(max_length=200)
    notes: str = Field(default="", max_length=1000)


class ServiceScheduleUpdate(SQLModel, table=False):
    next_service_date: Optional[date] = Field(default=None)
    next_service_mileage: Optional[int] = Field(default=None, ge=0)
    service_type: Optional[str] = Field(default=None, max_length=200)
    notes: Optional[str] = Field(default=None, max_length=1000)
