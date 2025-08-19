from sqlmodel import SQLModel, Field, Relationship, Column, DateTime
from datetime import datetime
from typing import Optional, List
from enum import Enum


class MembershipType(str, Enum):
    BASIC = "basic"
    PREMIUM = "premium"
    VIP = "vip"


class ClassStatus(str, Enum):
    SCHEDULED = "scheduled"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class BookingStatus(str, Enum):
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"
    ATTENDED = "attended"
    NO_SHOW = "no_show"


# Persistent models (stored in database)
class Member(SQLModel, table=True):
    __tablename__ = "members"  # type: ignore[assignment]

    id: Optional[int] = Field(default=None, primary_key=True)
    first_name: str = Field(max_length=100)
    last_name: str = Field(max_length=100)
    email: str = Field(unique=True, max_length=255)
    phone: Optional[str] = Field(default=None, max_length=20)
    membership_type: MembershipType = Field(default=MembershipType.BASIC)
    is_active: bool = Field(default=True)
    date_joined: datetime = Field(default_factory=datetime.utcnow)
    emergency_contact_name: Optional[str] = Field(default=None, max_length=100)
    emergency_contact_phone: Optional[str] = Field(default=None, max_length=20)
    medical_notes: Optional[str] = Field(default=None, max_length=500)

    bookings: List["Booking"] = Relationship(back_populates="member")


class Instructor(SQLModel, table=True):
    __tablename__ = "instructors"  # type: ignore[assignment]

    id: Optional[int] = Field(default=None, primary_key=True)
    first_name: str = Field(max_length=100)
    last_name: str = Field(max_length=100)
    email: str = Field(unique=True, max_length=255)
    phone: Optional[str] = Field(default=None, max_length=20)
    specializations: str = Field(default="", max_length=500)  # Comma-separated specializations
    bio: Optional[str] = Field(default=None, max_length=1000)
    is_active: bool = Field(default=True)
    hire_date: datetime = Field(default_factory=datetime.utcnow)

    gym_classes: List["GymClass"] = Relationship(back_populates="instructor")


class GymClass(SQLModel, table=True):
    __tablename__ = "gym_classes"  # type: ignore[assignment]

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(max_length=200)
    description: Optional[str] = Field(default=None, max_length=1000)
    instructor_id: int = Field(foreign_key="instructors.id")
    scheduled_date: datetime = Field(sa_column=Column(DateTime))
    duration_minutes: int = Field(default=60, ge=15, le=180)  # 15 minutes to 3 hours
    max_capacity: int = Field(default=20, ge=1, le=100)
    current_bookings: int = Field(default=0, ge=0)
    status: ClassStatus = Field(default=ClassStatus.SCHEDULED)
    room_number: Optional[str] = Field(default=None, max_length=50)
    equipment_needed: Optional[str] = Field(default=None, max_length=300)
    difficulty_level: Optional[str] = Field(default=None, max_length=50)  # Beginner, Intermediate, Advanced
    created_at: datetime = Field(default_factory=datetime.utcnow)

    instructor: Instructor = Relationship(back_populates="gym_classes")
    bookings: List["Booking"] = Relationship(back_populates="gym_class")


class Booking(SQLModel, table=True):
    __tablename__ = "bookings"  # type: ignore[assignment]

    id: Optional[int] = Field(default=None, primary_key=True)
    member_id: int = Field(foreign_key="members.id")
    gym_class_id: int = Field(foreign_key="gym_classes.id")
    booking_date: datetime = Field(default_factory=datetime.utcnow)
    status: BookingStatus = Field(default=BookingStatus.CONFIRMED)
    notes: Optional[str] = Field(default=None, max_length=500)

    member: Member = Relationship(back_populates="bookings")
    gym_class: GymClass = Relationship(back_populates="bookings")


# Non-persistent schemas (for validation, forms, API requests/responses)
class MemberCreate(SQLModel, table=False):
    first_name: str = Field(max_length=100)
    last_name: str = Field(max_length=100)
    email: str = Field(max_length=255)
    phone: Optional[str] = Field(default=None, max_length=20)
    membership_type: MembershipType = Field(default=MembershipType.BASIC)
    emergency_contact_name: Optional[str] = Field(default=None, max_length=100)
    emergency_contact_phone: Optional[str] = Field(default=None, max_length=20)
    medical_notes: Optional[str] = Field(default=None, max_length=500)


class MemberUpdate(SQLModel, table=False):
    first_name: Optional[str] = Field(default=None, max_length=100)
    last_name: Optional[str] = Field(default=None, max_length=100)
    email: Optional[str] = Field(default=None, max_length=255)
    phone: Optional[str] = Field(default=None, max_length=20)
    membership_type: Optional[MembershipType] = Field(default=None)
    is_active: Optional[bool] = Field(default=None)
    emergency_contact_name: Optional[str] = Field(default=None, max_length=100)
    emergency_contact_phone: Optional[str] = Field(default=None, max_length=20)
    medical_notes: Optional[str] = Field(default=None, max_length=500)


class InstructorCreate(SQLModel, table=False):
    first_name: str = Field(max_length=100)
    last_name: str = Field(max_length=100)
    email: str = Field(max_length=255)
    phone: Optional[str] = Field(default=None, max_length=20)
    specializations: str = Field(default="", max_length=500)
    bio: Optional[str] = Field(default=None, max_length=1000)


class InstructorUpdate(SQLModel, table=False):
    first_name: Optional[str] = Field(default=None, max_length=100)
    last_name: Optional[str] = Field(default=None, max_length=100)
    email: Optional[str] = Field(default=None, max_length=255)
    phone: Optional[str] = Field(default=None, max_length=20)
    specializations: Optional[str] = Field(default=None, max_length=500)
    bio: Optional[str] = Field(default=None, max_length=1000)
    is_active: Optional[bool] = Field(default=None)


class GymClassCreate(SQLModel, table=False):
    name: str = Field(max_length=200)
    description: Optional[str] = Field(default=None, max_length=1000)
    instructor_id: int
    scheduled_date: datetime
    duration_minutes: int = Field(default=60, ge=15, le=180)
    max_capacity: int = Field(default=20, ge=1, le=100)
    room_number: Optional[str] = Field(default=None, max_length=50)
    equipment_needed: Optional[str] = Field(default=None, max_length=300)
    difficulty_level: Optional[str] = Field(default=None, max_length=50)


class GymClassUpdate(SQLModel, table=False):
    name: Optional[str] = Field(default=None, max_length=200)
    description: Optional[str] = Field(default=None, max_length=1000)
    instructor_id: Optional[int] = Field(default=None)
    scheduled_date: Optional[datetime] = Field(default=None)
    duration_minutes: Optional[int] = Field(default=None, ge=15, le=180)
    max_capacity: Optional[int] = Field(default=None, ge=1, le=100)
    status: Optional[ClassStatus] = Field(default=None)
    room_number: Optional[str] = Field(default=None, max_length=50)
    equipment_needed: Optional[str] = Field(default=None, max_length=300)
    difficulty_level: Optional[str] = Field(default=None, max_length=50)


class BookingCreate(SQLModel, table=False):
    member_id: int
    gym_class_id: int
    notes: Optional[str] = Field(default=None, max_length=500)


class BookingUpdate(SQLModel, table=False):
    status: Optional[BookingStatus] = Field(default=None)
    notes: Optional[str] = Field(default=None, max_length=500)


# Read-only response schemas
class MemberResponse(SQLModel, table=False):
    id: int
    first_name: str
    last_name: str
    email: str
    phone: Optional[str]
    membership_type: MembershipType
    is_active: bool
    date_joined: str  # Will be converted to ISO format string


class InstructorResponse(SQLModel, table=False):
    id: int
    first_name: str
    last_name: str
    email: str
    specializations: str
    is_active: bool


class GymClassResponse(SQLModel, table=False):
    id: int
    name: str
    description: Optional[str]
    instructor_name: str
    scheduled_date: str  # Will be converted to ISO format string
    duration_minutes: int
    max_capacity: int
    current_bookings: int
    status: ClassStatus
    room_number: Optional[str]
    difficulty_level: Optional[str]


class BookingResponse(SQLModel, table=False):
    id: int
    member_name: str
    class_name: str
    scheduled_date: str  # Will be converted to ISO format string
    booking_date: str  # Will be converted to ISO format string
    status: BookingStatus
    notes: Optional[str]
