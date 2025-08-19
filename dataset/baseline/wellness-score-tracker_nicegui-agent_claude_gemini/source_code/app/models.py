from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime, date
from typing import Optional, List
from decimal import Decimal


class User(SQLModel, table=True):
    """User model for wellness tracking application"""

    __tablename__ = "users"  # type: ignore[assignment]

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(max_length=100)
    email: str = Field(unique=True, max_length=255)
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationship to wellness entries
    wellness_entries: List["WellnessEntry"] = Relationship(back_populates="user")


class WellnessEntry(SQLModel, table=True):
    """Daily wellness tracking entry with calculated wellness score"""

    __tablename__ = "wellness_entries"  # type: ignore[assignment]

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id")
    entry_date: date = Field(index=True)  # Date of the wellness entry

    # Wellness metrics
    sleep_hours: Decimal = Field(ge=0, le=24, decimal_places=1, description="Hours of sleep (0-24)")
    stress_level: int = Field(ge=1, le=10, description="Stress level on scale 1-10")
    caffeine_intake: Decimal = Field(ge=0, decimal_places=1, description="Caffeine intake (cups)")
    alcohol_intake: Decimal = Field(ge=0, decimal_places=1, description="Alcohol intake (drinks)")

    # Calculated wellness score
    wellness_score: Decimal = Field(decimal_places=1, description="Calculated wellness score")

    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationship back to user
    user: User = Relationship(back_populates="wellness_entries")

    def calculate_wellness_score(self) -> Decimal:
        """
        Calculate wellness score based on the following criteria:
        - Sleep: Optimal 7-9 hours (max 30 points)
        - Stress: Lower is better, inverted scale (max 25 points)
        - Caffeine: Moderate consumption preferred, 1-3 cups optimal (max 25 points)
        - Alcohol: Lower is better, 0-1 drinks optimal (max 20 points)
        Total possible score: 100 points
        """
        score = Decimal("0")

        # Sleep score (30 points max)
        sleep_float = float(self.sleep_hours)
        if 7 <= sleep_float <= 9:
            sleep_score = 30
        elif 6 <= sleep_float < 7 or 9 < sleep_float <= 10:
            sleep_score = 25
        elif 5 <= sleep_float < 6 or 10 < sleep_float <= 11:
            sleep_score = 20
        elif 4 <= sleep_float < 5 or 11 < sleep_float <= 12:
            sleep_score = 15
        elif sleep_float < 4 or sleep_float > 12:
            sleep_score = 5
        else:
            sleep_score = 10

        score += Decimal(str(sleep_score))

        # Stress score (25 points max) - inverted scale
        stress_score = max(0, (11 - self.stress_level) * 2.5)
        score += Decimal(str(stress_score))

        # Caffeine score (25 points max)
        caffeine_float = float(self.caffeine_intake)
        if 1 <= caffeine_float <= 3:
            caffeine_score = 25
        elif caffeine_float == 0 or 3 < caffeine_float <= 4:
            caffeine_score = 20
        elif 4 < caffeine_float <= 5:
            caffeine_score = 15
        elif 5 < caffeine_float <= 6:
            caffeine_score = 10
        else:
            caffeine_score = 5

        score += Decimal(str(caffeine_score))

        # Alcohol score (20 points max)
        alcohol_float = float(self.alcohol_intake)
        match alcohol_float:
            case 0:
                alcohol_score = 20
            case 1:
                alcohol_score = 15
            case 2:
                alcohol_score = 10
            case 3:
                alcohol_score = 7
            case _:
                alcohol_score = 3

        score += Decimal(str(alcohol_score))

        return score


# Non-persistent schemas for API operations and validation


class WellnessEntryCreate(SQLModel, table=False):
    """Schema for creating a new wellness entry"""

    user_id: int
    entry_date: date
    sleep_hours: Decimal = Field(ge=0, le=24, decimal_places=1)
    stress_level: int = Field(ge=1, le=10)
    caffeine_intake: Decimal = Field(ge=0, decimal_places=1)
    alcohol_intake: Decimal = Field(ge=0, decimal_places=1)


class WellnessEntryUpdate(SQLModel, table=False):
    """Schema for updating an existing wellness entry"""

    sleep_hours: Optional[Decimal] = Field(default=None, ge=0, le=24, decimal_places=1)
    stress_level: Optional[int] = Field(default=None, ge=1, le=10)
    caffeine_intake: Optional[Decimal] = Field(default=None, ge=0, decimal_places=1)
    alcohol_intake: Optional[Decimal] = Field(default=None, ge=0, decimal_places=1)


class UserCreate(SQLModel, table=False):
    """Schema for creating a new user"""

    name: str = Field(max_length=100)
    email: str = Field(max_length=255)


class WellnessEntryResponse(SQLModel, table=False):
    """Schema for wellness entry API responses with calculated score"""

    id: int
    user_id: int
    entry_date: date
    sleep_hours: Decimal
    stress_level: int
    caffeine_intake: Decimal
    alcohol_intake: Decimal
    wellness_score: Decimal
    created_at: datetime
    updated_at: datetime


class WellnessTrend(SQLModel, table=False):
    """Schema for wellness trend data over time"""

    entry_date: date
    wellness_score: Decimal
    sleep_hours: Decimal
    stress_level: int
    caffeine_intake: Decimal
    alcohol_intake: Decimal
