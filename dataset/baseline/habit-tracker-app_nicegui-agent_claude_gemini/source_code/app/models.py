from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime, date
from typing import Optional, List


# Persistent models (stored in database)
class Habit(SQLModel, table=True):
    __tablename__ = "habits"  # type: ignore[assignment]

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(max_length=200)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = Field(default=True)

    # Relationship to check-ins
    check_ins: List["HabitCheckIn"] = Relationship(back_populates="habit")


class HabitCheckIn(SQLModel, table=True):
    __tablename__ = "habit_check_ins"  # type: ignore[assignment]

    id: Optional[int] = Field(default=None, primary_key=True)
    habit_id: int = Field(foreign_key="habits.id")
    check_in_date: date = Field(default_factory=date.today)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationship to habit
    habit: Habit = Relationship(back_populates="check_ins")


# Non-persistent schemas (for validation, forms, API requests/responses)
class HabitCreate(SQLModel, table=False):
    name: str = Field(max_length=200)


class HabitUpdate(SQLModel, table=False):
    name: Optional[str] = Field(default=None, max_length=200)
    is_active: Optional[bool] = Field(default=None)


class HabitCheckInCreate(SQLModel, table=False):
    habit_id: int
    check_in_date: Optional[date] = Field(default=None)  # Defaults to today if not provided


class HabitWithStreak(SQLModel, table=False):
    """Schema for returning habit information with current streak"""

    id: int
    name: str
    created_at: datetime
    is_active: bool
    current_streak: int
    last_check_in: Optional[date] = None
    total_check_ins: int
