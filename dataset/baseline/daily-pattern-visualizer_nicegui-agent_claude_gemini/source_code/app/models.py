from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime, date
from typing import Optional, List
from decimal import Decimal


# Persistent models (stored in database)
class User(SQLModel, table=True):
    __tablename__ = "users"  # type: ignore[assignment]

    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(max_length=100, unique=True)
    email: str = Field(max_length=255, unique=True, regex=r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")
    full_name: str = Field(max_length=200)
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    daily_entries: List["DailyEntry"] = Relationship(back_populates="user")
    break_suggestions: List["BreakSuggestion"] = Relationship(back_populates="user")


class DailyEntry(SQLModel, table=True):
    __tablename__ = "daily_entries"  # type: ignore[assignment]

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id")
    entry_date: date = Field(index=True)
    sleep_hours: Decimal = Field(max_digits=4, decimal_places=1, ge=0.0, le=24.0)
    work_hours: Decimal = Field(max_digits=4, decimal_places=1, ge=0.0, le=24.0)
    social_hours: Decimal = Field(max_digits=4, decimal_places=1, ge=0.0, le=24.0)
    screen_hours: Decimal = Field(max_digits=4, decimal_places=1, ge=0.0, le=24.0)
    emotional_energy: int = Field(ge=1, le=10)  # Scale of 1-10
    notes: Optional[str] = Field(default=None, max_length=500)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    user: User = Relationship(back_populates="daily_entries")


class BreakSuggestion(SQLModel, table=True):
    __tablename__ = "break_suggestions"  # type: ignore[assignment]

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id")
    suggestion_type: str = Field(max_length=50)  # e.g., "screen_break", "work_break", "social_break"
    message: str = Field(max_length=500)
    priority: int = Field(ge=1, le=5)  # 1=low, 5=high priority
    suggested_at: datetime = Field(default_factory=datetime.utcnow)
    is_dismissed: bool = Field(default=False)
    dismissed_at: Optional[datetime] = Field(default=None)

    user: User = Relationship(back_populates="break_suggestions")


# Non-persistent schemas (for validation, forms, API requests/responses)
class UserCreate(SQLModel, table=False):
    username: str = Field(max_length=100)
    email: str = Field(max_length=255, regex=r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")
    full_name: str = Field(max_length=200)


class UserUpdate(SQLModel, table=False):
    username: Optional[str] = Field(default=None, max_length=100)
    email: Optional[str] = Field(
        default=None, max_length=255, regex=r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$"
    )
    full_name: Optional[str] = Field(default=None, max_length=200)
    is_active: Optional[bool] = Field(default=None)


class DailyEntryCreate(SQLModel, table=False):
    entry_date: date
    sleep_hours: Decimal = Field(max_digits=4, decimal_places=1, ge=0.0, le=24.0)
    work_hours: Decimal = Field(max_digits=4, decimal_places=1, ge=0.0, le=24.0)
    social_hours: Decimal = Field(max_digits=4, decimal_places=1, ge=0.0, le=24.0)
    screen_hours: Decimal = Field(max_digits=4, decimal_places=1, ge=0.0, le=24.0)
    emotional_energy: int = Field(ge=1, le=10)
    notes: Optional[str] = Field(default=None, max_length=500)


class DailyEntryUpdate(SQLModel, table=False):
    sleep_hours: Optional[Decimal] = Field(default=None, max_digits=4, decimal_places=1, ge=0.0, le=24.0)
    work_hours: Optional[Decimal] = Field(default=None, max_digits=4, decimal_places=1, ge=0.0, le=24.0)
    social_hours: Optional[Decimal] = Field(default=None, max_digits=4, decimal_places=1, ge=0.0, le=24.0)
    screen_hours: Optional[Decimal] = Field(default=None, max_digits=4, decimal_places=1, ge=0.0, le=24.0)
    emotional_energy: Optional[int] = Field(default=None, ge=1, le=10)
    notes: Optional[str] = Field(default=None, max_length=500)


class BreakSuggestionCreate(SQLModel, table=False):
    user_id: int
    suggestion_type: str = Field(max_length=50)
    message: str = Field(max_length=500)
    priority: int = Field(ge=1, le=5)


class BreakSuggestionUpdate(SQLModel, table=False):
    is_dismissed: Optional[bool] = Field(default=None)
    dismissed_at: Optional[datetime] = Field(default=None)


# Response schemas for API endpoints
class DailyEntryResponse(SQLModel, table=False):
    id: int
    user_id: int
    entry_date: date
    sleep_hours: Decimal
    work_hours: Decimal
    social_hours: Decimal
    screen_hours: Decimal
    emotional_energy: int
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime


class UserResponse(SQLModel, table=False):
    id: int
    username: str
    email: str
    full_name: str
    is_active: bool
    created_at: datetime


class BreakSuggestionResponse(SQLModel, table=False):
    id: int
    user_id: int
    suggestion_type: str
    message: str
    priority: int
    suggested_at: datetime
    is_dismissed: bool
    dismissed_at: Optional[datetime]
