from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime, date
from typing import Optional, List
from decimal import Decimal

# Persistent models (stored in database)


class Cat(SQLModel, table=True):
    """A potentially suspicious feline subject under surveillance"""

    __tablename__ = "cats"  # type: ignore[assignment]

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(max_length=100)
    breed: Optional[str] = Field(default=None, max_length=50)
    color: Optional[str] = Field(default=None, max_length=50)
    age_months: Optional[int] = Field(default=None, ge=0)
    description: Optional[str] = Field(default=None, max_length=500)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationship to activity logs
    activity_logs: List["ActivityLog"] = Relationship(back_populates="cat")


class SuspiciousActivity(SQLModel, table=True):
    """Predefined suspicious behaviors that cats engage in"""

    __tablename__ = "suspicious_activities"  # type: ignore[assignment]

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(max_length=100, unique=True)
    description: str = Field(max_length=500)
    conspiracy_points: Decimal = Field(default=Decimal("1"), ge=0.0, le=10.0)
    icon: Optional[str] = Field(default=None, max_length=50)  # For UI icons/emojis
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationship to activity logs
    activity_logs: List["ActivityLog"] = Relationship(back_populates="activity")


class ActivityLog(SQLModel, table=True):
    """Individual instances of suspicious cat behavior"""

    __tablename__ = "activity_logs"  # type: ignore[assignment]

    id: Optional[int] = Field(default=None, primary_key=True)
    cat_id: int = Field(foreign_key="cats.id")
    activity_id: int = Field(foreign_key="suspicious_activities.id")
    logged_at: datetime = Field(default_factory=datetime.utcnow)
    logged_date: date = Field(default_factory=date.today)  # For daily conspiracy level calculation
    notes: Optional[str] = Field(default=None, max_length=1000)
    intensity: int = Field(default=1, ge=1, le=5)  # 1-5 scale for how suspicious the instance was

    # Relationships
    cat: Cat = Relationship(back_populates="activity_logs")
    activity: SuspiciousActivity = Relationship(back_populates="activity_logs")


# Non-persistent schemas (for validation, forms, API requests/responses)


class CatCreate(SQLModel, table=False):
    """Schema for creating a new cat"""

    name: str = Field(max_length=100)
    breed: Optional[str] = Field(default=None, max_length=50)
    color: Optional[str] = Field(default=None, max_length=50)
    age_months: Optional[int] = Field(default=None, ge=0)
    description: Optional[str] = Field(default=None, max_length=500)


class CatUpdate(SQLModel, table=False):
    """Schema for updating cat information"""

    name: Optional[str] = Field(default=None, max_length=100)
    breed: Optional[str] = Field(default=None, max_length=50)
    color: Optional[str] = Field(default=None, max_length=50)
    age_months: Optional[int] = Field(default=None, ge=0)
    description: Optional[str] = Field(default=None, max_length=500)


class SuspiciousActivityCreate(SQLModel, table=False):
    """Schema for creating a new suspicious activity type"""

    name: str = Field(max_length=100)
    description: str = Field(max_length=500)
    conspiracy_points: Decimal = Field(default=Decimal("1"), ge=0.0, le=10.0)
    icon: Optional[str] = Field(default=None, max_length=50)


class SuspiciousActivityUpdate(SQLModel, table=False):
    """Schema for updating suspicious activity information"""

    name: Optional[str] = Field(default=None, max_length=100)
    description: Optional[str] = Field(default=None, max_length=500)
    conspiracy_points: Optional[Decimal] = Field(default=None, ge=0.0, le=10.0)
    icon: Optional[str] = Field(default=None, max_length=50)


class ActivityLogCreate(SQLModel, table=False):
    """Schema for logging a new suspicious activity instance"""

    cat_id: int
    activity_id: int
    notes: Optional[str] = Field(default=None, max_length=1000)
    intensity: int = Field(default=1, ge=1, le=5)


class ActivityLogUpdate(SQLModel, table=False):
    """Schema for updating an activity log entry"""

    notes: Optional[str] = Field(default=None, max_length=1000)
    intensity: Optional[int] = Field(default=None, ge=1, le=5)


class DailyConspiracyLevel(SQLModel, table=False):
    """Schema for daily conspiracy level calculation results"""

    cat_id: int
    cat_name: str
    date: date
    total_points: Decimal
    activity_count: int
    conspiracy_level: str  # e.g., "Low", "Moderate", "High", "MAXIMUM ALERT"
    level_description: str  # Humorous description of the conspiracy level


class ConspiracyLevelSummary(SQLModel, table=False):
    """Schema for conspiracy level summary across all cats"""

    date: date
    cats: List[DailyConspiracyLevel]
    overall_threat_level: str
    total_activities: int
    most_suspicious_cat: Optional[str] = Field(default=None)
