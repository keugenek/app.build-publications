from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime, date, timedelta
from typing import Optional, List
from enum import Enum


class PlantMood(str, Enum):
    """Enum for different plant moods based on watering frequency."""

    HAPPY = "Happy"
    CONTENT = "Content"
    THIRSTY = "Thirsty"
    DYING = "Dying"
    DROWNING = "Drowning"


class PlantType(str, Enum):
    """Common plant types with different watering needs."""

    SUCCULENT = "Succulent"
    TROPICAL = "Tropical"
    HERB = "Herb"
    FLOWERING = "Flowering"
    TREE = "Tree"
    FERN = "Fern"
    CACTUS = "Cactus"


# Persistent models (stored in database)
class Plant(SQLModel, table=True):
    """Main plant model with watering tracking and mood calculation."""

    __tablename__ = "plants"  # type: ignore[assignment]

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(max_length=200, description="Plant's common name")
    scientific_name: Optional[str] = Field(default=None, max_length=300, description="Scientific name of the plant")
    plant_type: PlantType = Field(default=PlantType.TROPICAL, description="Type of plant for watering guidance")
    location: str = Field(max_length=100, description="Where the plant is located")
    last_watered: Optional[date] = Field(default=None, description="Date when plant was last watered")
    watering_frequency_days: int = Field(
        default=7, gt=0, le=365, description="How often plant should be watered (days)"
    )
    notes: str = Field(default="", max_length=1000, description="Additional notes about the plant")
    acquired_date: Optional[date] = Field(default=None, description="When the plant was acquired")
    is_active: bool = Field(default=True, description="Whether the plant is still being tracked")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default=None)

    # Relationships
    watering_records: List["WateringRecord"] = Relationship(back_populates="plant", cascade_delete=True)

    def calculate_mood(self) -> PlantMood:
        """Calculate plant mood based on watering schedule."""
        if self.last_watered is None:
            return PlantMood.THIRSTY

        days_since_watered = (date.today() - self.last_watered).days

        # Calculate mood based on watering frequency
        if days_since_watered < 0:
            # Future date - something is wrong
            return PlantMood.CONTENT
        elif days_since_watered == 0:
            return PlantMood.HAPPY
        elif days_since_watered <= (self.watering_frequency_days * 0.7):
            return PlantMood.CONTENT
        elif days_since_watered <= self.watering_frequency_days:
            return PlantMood.THIRSTY
        elif days_since_watered <= (self.watering_frequency_days * 2):
            return PlantMood.DYING
        else:
            return PlantMood.DROWNING  # Over-watered or severely neglected

    def days_since_watered(self) -> Optional[int]:
        """Get number of days since last watering."""
        if self.last_watered is None:
            return None
        return (date.today() - self.last_watered).days

    def next_watering_date(self) -> Optional[date]:
        """Calculate when plant should be watered next."""
        if self.last_watered is None:
            return date.today()
        return self.last_watered + timedelta(days=self.watering_frequency_days)

    def is_due_for_watering(self) -> bool:
        """Check if plant is due for watering."""
        next_watering = self.next_watering_date()
        if next_watering is None:
            return True
        return date.today() >= next_watering

    @property
    def mood(self) -> PlantMood:
        """Property to get current plant mood."""
        return self.calculate_mood()


class WateringRecord(SQLModel, table=True):
    """Track individual watering events for plants."""

    __tablename__ = "watering_records"  # type: ignore[assignment]

    id: Optional[int] = Field(default=None, primary_key=True)
    plant_id: int = Field(foreign_key="plants.id", description="ID of the plant that was watered")
    watered_date: date = Field(description="Date when watering occurred")
    amount_ml: Optional[int] = Field(default=None, ge=0, description="Amount of water in milliliters")
    notes: str = Field(default="", max_length=500, description="Notes about this watering")
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    plant: Plant = Relationship(back_populates="watering_records")


class PlantCareReminder(SQLModel, table=True):
    """Store care reminders and tasks for plants."""

    __tablename__ = "plant_care_reminders"  # type: ignore[assignment]

    id: Optional[int] = Field(default=None, primary_key=True)
    plant_id: int = Field(foreign_key="plants.id", description="ID of the plant")
    task_name: str = Field(max_length=200, description="Name of the care task")
    description: str = Field(default="", max_length=500, description="Detailed description of the task")
    frequency_days: int = Field(gt=0, description="How often task should be done (days)")
    last_completed: Optional[date] = Field(default=None, description="When task was last completed")
    is_active: bool = Field(default=True, description="Whether reminder is active")
    created_at: datetime = Field(default_factory=datetime.utcnow)

    def is_due(self) -> bool:
        """Check if care task is due."""
        if self.last_completed is None:
            return True
        return (date.today() - self.last_completed).days >= self.frequency_days

    def next_due_date(self) -> date:
        """Calculate when task is next due."""
        if self.last_completed is None:
            return date.today()
        return self.last_completed + timedelta(days=self.frequency_days)


# Non-persistent schemas (for validation, forms, API requests/responses)
class PlantCreate(SQLModel, table=False):
    """Schema for creating a new plant."""

    name: str = Field(max_length=200)
    scientific_name: Optional[str] = Field(default=None, max_length=300)
    plant_type: PlantType = Field(default=PlantType.TROPICAL)
    location: str = Field(max_length=100)
    watering_frequency_days: int = Field(default=7, gt=0, le=365)
    notes: str = Field(default="", max_length=1000)
    acquired_date: Optional[date] = Field(default=None)
    last_watered: Optional[date] = Field(default=None)


class PlantUpdate(SQLModel, table=False):
    """Schema for updating an existing plant."""

    name: Optional[str] = Field(default=None, max_length=200)
    scientific_name: Optional[str] = Field(default=None, max_length=300)
    plant_type: Optional[PlantType] = Field(default=None)
    location: Optional[str] = Field(default=None, max_length=100)
    watering_frequency_days: Optional[int] = Field(default=None, gt=0, le=365)
    notes: Optional[str] = Field(default=None, max_length=1000)
    acquired_date: Optional[date] = Field(default=None)
    last_watered: Optional[date] = Field(default=None)
    is_active: Optional[bool] = Field(default=None)


class WateringRecordCreate(SQLModel, table=False):
    """Schema for creating a watering record."""

    plant_id: int
    watered_date: date = Field(default_factory=date.today)
    amount_ml: Optional[int] = Field(default=None, ge=0)
    notes: str = Field(default="", max_length=500)


class WateringRecordUpdate(SQLModel, table=False):
    """Schema for updating a watering record."""

    watered_date: Optional[date] = Field(default=None)
    amount_ml: Optional[int] = Field(default=None, ge=0)
    notes: Optional[str] = Field(default=None, max_length=500)


class PlantCareReminderCreate(SQLModel, table=False):
    """Schema for creating a plant care reminder."""

    plant_id: int
    task_name: str = Field(max_length=200)
    description: str = Field(default="", max_length=500)
    frequency_days: int = Field(gt=0)
    last_completed: Optional[date] = Field(default=None)


class PlantCareReminderUpdate(SQLModel, table=False):
    """Schema for updating a plant care reminder."""

    task_name: Optional[str] = Field(default=None, max_length=200)
    description: Optional[str] = Field(default=None, max_length=500)
    frequency_days: Optional[int] = Field(default=None, gt=0)
    last_completed: Optional[date] = Field(default=None)
    is_active: Optional[bool] = Field(default=None)


class PlantWithMood(SQLModel, table=False):
    """Schema for plant data with calculated mood - useful for API responses."""

    id: Optional[int]
    name: str
    scientific_name: Optional[str]
    plant_type: PlantType
    location: str
    last_watered: Optional[date]
    watering_frequency_days: int
    notes: str
    acquired_date: Optional[date]
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime]

    # Calculated fields
    mood: PlantMood
    days_since_watered: Optional[int]
    next_watering_date: Optional[date]
    is_due_for_watering: bool

    @classmethod
    def from_plant(cls, plant: Plant) -> "PlantWithMood":
        """Create PlantWithMood from Plant instance."""
        return cls(
            id=plant.id,
            name=plant.name,
            scientific_name=plant.scientific_name,
            plant_type=plant.plant_type,
            location=plant.location,
            last_watered=plant.last_watered,
            watering_frequency_days=plant.watering_frequency_days,
            notes=plant.notes,
            acquired_date=plant.acquired_date,
            is_active=plant.is_active,
            created_at=plant.created_at,
            updated_at=plant.updated_at,
            mood=plant.calculate_mood(),
            days_since_watered=plant.days_since_watered(),
            next_watering_date=plant.next_watering_date(),
            is_due_for_watering=plant.is_due_for_watering(),
        )
