from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime, date
from typing import Optional, List
from enum import Enum


class ChoreStatus(str, Enum):
    """Status of a chore assignment."""

    PENDING = "pending"
    COMPLETED = "completed"
    OVERDUE = "overdue"


# Persistent models (stored in database)
class HouseholdMember(SQLModel, table=True):
    """Represents a member of the household who can be assigned chores."""

    __tablename__ = "household_members"  # type: ignore[assignment]

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(max_length=100, index=True)
    email: Optional[str] = Field(default=None, max_length=255)
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    assignments: List["WeeklyAssignment"] = Relationship(back_populates="member")


class Chore(SQLModel, table=True):
    """Represents a chore that can be assigned to household members."""

    __tablename__ = "chores"  # type: ignore[assignment]

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(max_length=200, index=True)
    description: str = Field(default="", max_length=1000)
    estimated_minutes: Optional[int] = Field(default=None, ge=1)
    difficulty_level: int = Field(default=1, ge=1, le=5)  # 1=easy, 5=hard
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    assignments: List["WeeklyAssignment"] = Relationship(back_populates="chore")


class WeeklySchedule(SQLModel, table=True):
    """Represents a weekly schedule containing multiple chore assignments."""

    __tablename__ = "weekly_schedules"  # type: ignore[assignment]

    id: Optional[int] = Field(default=None, primary_key=True)
    week_start_date: date = Field(index=True)  # Monday of the week
    week_end_date: date = Field(index=True)  # Sunday of the week
    is_current: bool = Field(default=False, index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    notes: str = Field(default="", max_length=500)

    # Relationships
    assignments: List["WeeklyAssignment"] = Relationship(back_populates="schedule")


class WeeklyAssignment(SQLModel, table=True):
    """Represents the assignment of a specific chore to a specific member for a specific week."""

    __tablename__ = "weekly_assignments"  # type: ignore[assignment]

    id: Optional[int] = Field(default=None, primary_key=True)
    schedule_id: int = Field(foreign_key="weekly_schedules.id", index=True)
    chore_id: int = Field(foreign_key="chores.id", index=True)
    member_id: int = Field(foreign_key="household_members.id", index=True)

    status: ChoreStatus = Field(default=ChoreStatus.PENDING, index=True)
    assigned_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = Field(default=None)
    due_date: Optional[date] = Field(default=None)

    # Optional fields for tracking
    notes: str = Field(default="", max_length=500)
    rating: Optional[int] = Field(default=None, ge=1, le=5)  # Quality rating after completion

    # Relationships
    schedule: WeeklySchedule = Relationship(back_populates="assignments")
    chore: Chore = Relationship(back_populates="assignments")
    member: HouseholdMember = Relationship(back_populates="assignments")


class AssignmentHistory(SQLModel, table=True):
    """Tracks historical data about chore assignments for analytics and fairness."""

    __tablename__ = "assignment_history"  # type: ignore[assignment]

    id: Optional[int] = Field(default=None, primary_key=True)
    member_id: int = Field(foreign_key="household_members.id", index=True)
    chore_id: int = Field(foreign_key="chores.id", index=True)
    week_start_date: date = Field(index=True)

    # Aggregated statistics
    total_assignments: int = Field(default=0, ge=0)
    completed_assignments: int = Field(default=0, ge=0)
    average_rating: Optional[float] = Field(default=None, ge=1.0, le=5.0)
    total_estimated_minutes: int = Field(default=0, ge=0)

    last_assigned_date: Optional[date] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


# Non-persistent schemas (for validation, forms, API requests/responses)
class HouseholdMemberCreate(SQLModel, table=False):
    """Schema for creating a new household member."""

    name: str = Field(max_length=100)
    email: Optional[str] = Field(default=None, max_length=255)


class HouseholdMemberUpdate(SQLModel, table=False):
    """Schema for updating an existing household member."""

    name: Optional[str] = Field(default=None, max_length=100)
    email: Optional[str] = Field(default=None, max_length=255)
    is_active: Optional[bool] = Field(default=None)


class ChoreCreate(SQLModel, table=False):
    """Schema for creating a new chore."""

    name: str = Field(max_length=200)
    description: str = Field(default="", max_length=1000)
    estimated_minutes: Optional[int] = Field(default=None, ge=1)
    difficulty_level: int = Field(default=1, ge=1, le=5)


class ChoreUpdate(SQLModel, table=False):
    """Schema for updating an existing chore."""

    name: Optional[str] = Field(default=None, max_length=200)
    description: Optional[str] = Field(default=None, max_length=1000)
    estimated_minutes: Optional[int] = Field(default=None, ge=1)
    difficulty_level: Optional[int] = Field(default=None, ge=1, le=5)
    is_active: Optional[bool] = Field(default=None)


class WeeklyScheduleCreate(SQLModel, table=False):
    """Schema for creating a new weekly schedule."""

    week_start_date: date
    notes: str = Field(default="", max_length=500)


class WeeklyAssignmentCreate(SQLModel, table=False):
    """Schema for creating a new weekly assignment."""

    schedule_id: int
    chore_id: int
    member_id: int
    due_date: Optional[date] = Field(default=None)
    notes: str = Field(default="", max_length=500)


class WeeklyAssignmentUpdate(SQLModel, table=False):
    """Schema for updating an existing weekly assignment."""

    status: Optional[ChoreStatus] = Field(default=None)
    completed_at: Optional[datetime] = Field(default=None)
    due_date: Optional[date] = Field(default=None)
    notes: Optional[str] = Field(default=None, max_length=500)
    rating: Optional[int] = Field(default=None, ge=1, le=5)


class AssignmentStats(SQLModel, table=False):
    """Schema for returning assignment statistics."""

    member_id: int
    member_name: str
    total_assignments: int
    completed_assignments: int
    completion_rate: float
    average_rating: Optional[float]
    total_estimated_minutes: int


class WeeklyScheduleStats(SQLModel, table=False):
    """Schema for returning weekly schedule statistics."""

    schedule_id: int
    week_start_date: date
    week_end_date: date
    total_assignments: int
    completed_assignments: int
    pending_assignments: int
    overdue_assignments: int
    completion_rate: float
