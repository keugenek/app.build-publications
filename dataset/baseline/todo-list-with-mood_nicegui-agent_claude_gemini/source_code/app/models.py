from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime, date
from typing import Optional, List
from enum import IntEnum


class MoodScale(IntEnum):
    """Mood scale from 1 (very bad) to 5 (excellent)"""

    VERY_BAD = 1
    BAD = 2
    NEUTRAL = 3
    GOOD = 4
    EXCELLENT = 5


# Persistent models (stored in database)
class User(SQLModel, table=True):
    """User model for the journal application"""

    __tablename__ = "users"  # type: ignore[assignment]

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(max_length=100)
    email: str = Field(unique=True, max_length=255)
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    daily_entries: List["DailyEntry"] = Relationship(back_populates="user")
    tasks: List["Task"] = Relationship(back_populates="user")


class DailyEntry(SQLModel, table=True):
    """Daily journal entry containing mood and general notes"""

    __tablename__ = "daily_entries"  # type: ignore[assignment]

    id: Optional[int] = Field(default=None, primary_key=True)
    entry_date: date = Field(unique=True, index=True)
    mood_rating: int = Field(ge=1, le=5, description="Mood rating from 1 (very bad) to 5 (excellent)")
    notes: str = Field(default="", max_length=2000, description="Optional daily notes")
    user_id: int = Field(foreign_key="users.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    user: User = Relationship(back_populates="daily_entries")
    tasks: List["Task"] = Relationship(back_populates="daily_entry")


class Task(SQLModel, table=True):
    """Task/to-do item linked to a daily entry"""

    __tablename__ = "tasks"  # type: ignore[assignment]

    id: Optional[int] = Field(default=None, primary_key=True)
    title: str = Field(max_length=200)
    description: str = Field(default="", max_length=1000)
    completed: bool = Field(default=False)
    completed_at: Optional[datetime] = Field(default=None)
    priority: int = Field(default=3, ge=1, le=5, description="Priority from 1 (low) to 5 (high)")

    # Foreign keys
    user_id: int = Field(foreign_key="users.id")
    daily_entry_id: Optional[int] = Field(default=None, foreign_key="daily_entries.id")

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    user: User = Relationship(back_populates="tasks")
    daily_entry: Optional[DailyEntry] = Relationship(back_populates="tasks")


# Non-persistent schemas (for validation, forms, API requests/responses)
class UserCreate(SQLModel, table=False):
    """Schema for creating a new user"""

    name: str = Field(max_length=100)
    email: str = Field(max_length=255)


class UserUpdate(SQLModel, table=False):
    """Schema for updating user information"""

    name: Optional[str] = Field(default=None, max_length=100)
    email: Optional[str] = Field(default=None, max_length=255)
    is_active: Optional[bool] = Field(default=None)


class DailyEntryCreate(SQLModel, table=False):
    """Schema for creating a daily entry"""

    entry_date: date
    mood_rating: int = Field(ge=1, le=5)
    notes: str = Field(default="", max_length=2000)
    user_id: int


class DailyEntryUpdate(SQLModel, table=False):
    """Schema for updating a daily entry"""

    mood_rating: Optional[int] = Field(default=None, ge=1, le=5)
    notes: Optional[str] = Field(default=None, max_length=2000)


class TaskCreate(SQLModel, table=False):
    """Schema for creating a new task"""

    title: str = Field(max_length=200)
    description: str = Field(default="", max_length=1000)
    priority: int = Field(default=3, ge=1, le=5)
    user_id: int
    daily_entry_id: Optional[int] = Field(default=None)


class TaskUpdate(SQLModel, table=False):
    """Schema for updating a task"""

    title: Optional[str] = Field(default=None, max_length=200)
    description: Optional[str] = Field(default=None, max_length=1000)
    completed: Optional[bool] = Field(default=None)
    priority: Optional[int] = Field(default=None, ge=1, le=5)
    daily_entry_id: Optional[int] = Field(default=None)


class DailyEntryWithTasks(SQLModel, table=False):
    """Schema for displaying daily entry with associated tasks"""

    id: int
    entry_date: date
    mood_rating: int
    notes: str
    created_at: datetime
    completed_tasks_count: int
    total_tasks_count: int
    tasks: List["TaskResponse"]


class TaskResponse(SQLModel, table=False):
    """Schema for task response with all details"""

    id: int
    title: str
    description: str
    completed: bool
    completed_at: Optional[datetime]
    priority: int
    created_at: datetime
    updated_at: datetime


class MoodSummary(SQLModel, table=False):
    """Schema for mood analytics and summaries"""

    average_mood: float
    total_entries: int
    date_range_start: date
    date_range_end: date
    mood_distribution: dict[int, int]  # mood_rating -> count
