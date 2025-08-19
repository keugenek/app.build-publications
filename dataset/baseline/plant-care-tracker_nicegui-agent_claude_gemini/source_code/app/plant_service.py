"""Service layer for plant management operations."""

from datetime import date, datetime
from typing import List, Optional
from sqlmodel import select, desc
from app.database import get_session
from app.models import (
    Plant,
    PlantCreate,
    PlantUpdate,
    PlantWithMood,
    WateringRecord,
    WateringRecordCreate,
    PlantCareReminder,
    PlantCareReminderCreate,
    PlantMood,
)


class PlantService:
    """Service for managing plant operations."""

    @staticmethod
    def get_all_active_plants() -> List[PlantWithMood]:
        """Get all active plants with their mood information."""
        with get_session() as session:
            plants = session.exec(select(Plant).where(Plant.is_active)).all()
            return [PlantWithMood.from_plant(plant) for plant in plants]

    @staticmethod
    def get_plant_by_id(plant_id: int) -> Optional[PlantWithMood]:
        """Get a plant by its ID with mood information."""
        with get_session() as session:
            plant = session.get(Plant, plant_id)
            if plant is None or not plant.is_active:
                return None
            return PlantWithMood.from_plant(plant)

    @staticmethod
    def create_plant(plant_data: PlantCreate) -> PlantWithMood:
        """Create a new plant."""
        with get_session() as session:
            plant = Plant(**plant_data.model_dump())
            session.add(plant)
            session.commit()
            session.refresh(plant)
            return PlantWithMood.from_plant(plant)

    @staticmethod
    def update_plant(plant_id: int, plant_data: PlantUpdate) -> Optional[PlantWithMood]:
        """Update an existing plant."""
        with get_session() as session:
            plant = session.get(Plant, plant_id)
            if plant is None:
                return None

            update_data = plant_data.model_dump(exclude_unset=True)
            for field, value in update_data.items():
                setattr(plant, field, value)

            plant.updated_at = datetime.utcnow()
            session.add(plant)
            session.commit()
            session.refresh(plant)
            return PlantWithMood.from_plant(plant)

    @staticmethod
    def delete_plant(plant_id: int) -> bool:
        """Soft delete a plant by setting is_active to False."""
        with get_session() as session:
            plant = session.get(Plant, plant_id)
            if plant is None:
                return False

            plant.is_active = False
            plant.updated_at = datetime.utcnow()
            session.add(plant)
            session.commit()
            return True

    @staticmethod
    def water_plant(plant_id: int, watering_data: WateringRecordCreate) -> Optional[PlantWithMood]:
        """Record a watering event for a plant."""
        with get_session() as session:
            plant = session.get(Plant, plant_id)
            if plant is None:
                return None

            # Create watering record
            watering_record = WateringRecord(**watering_data.model_dump())
            session.add(watering_record)

            # Update plant's last watered date
            plant.last_watered = watering_data.watered_date
            plant.updated_at = datetime.utcnow()
            session.add(plant)

            session.commit()
            session.refresh(plant)
            return PlantWithMood.from_plant(plant)

    @staticmethod
    def get_watering_history(plant_id: int, limit: int = 10) -> List[WateringRecord]:
        """Get watering history for a plant."""
        with get_session() as session:
            records = session.exec(
                select(WateringRecord)
                .where(WateringRecord.plant_id == plant_id)
                .order_by(desc(WateringRecord.watered_date))
                .limit(limit)
            ).all()
            return list(records)

    @staticmethod
    def get_plants_by_mood(mood: PlantMood) -> List[PlantWithMood]:
        """Get plants filtered by their current mood."""
        all_plants = PlantService.get_all_active_plants()
        return [plant for plant in all_plants if plant.mood == mood]

    @staticmethod
    def get_plants_needing_water() -> List[PlantWithMood]:
        """Get plants that are due for watering."""
        all_plants = PlantService.get_all_active_plants()
        return [plant for plant in all_plants if plant.is_due_for_watering]

    @staticmethod
    def get_plant_statistics() -> dict:
        """Get overall plant care statistics."""
        all_plants = PlantService.get_all_active_plants()

        if not all_plants:
            return {
                "total_plants": 0,
                "plants_needing_water": 0,
                "happy_plants": 0,
                "mood_distribution": {},
            }

        plants_needing_water = len([p for p in all_plants if p.is_due_for_watering])
        happy_plants = len([p for p in all_plants if p.mood == PlantMood.HAPPY])

        mood_distribution = {}
        for mood in PlantMood:
            mood_distribution[mood.value] = len([p for p in all_plants if p.mood == mood])

        return {
            "total_plants": len(all_plants),
            "plants_needing_water": plants_needing_water,
            "happy_plants": happy_plants,
            "mood_distribution": mood_distribution,
        }

    @staticmethod
    def create_care_reminder(reminder_data: PlantCareReminderCreate) -> Optional[PlantCareReminder]:
        """Create a care reminder for a plant."""
        with get_session() as session:
            # Verify plant exists
            plant = session.get(Plant, reminder_data.plant_id)
            if plant is None:
                return None

            reminder = PlantCareReminder(**reminder_data.model_dump())
            session.add(reminder)
            session.commit()
            session.refresh(reminder)
            return reminder

    @staticmethod
    def get_active_reminders(plant_id: Optional[int] = None) -> List[PlantCareReminder]:
        """Get active care reminders, optionally filtered by plant."""
        with get_session() as session:
            query = select(PlantCareReminder).where(PlantCareReminder.is_active)
            if plant_id is not None:
                query = query.where(PlantCareReminder.plant_id == plant_id)

            reminders = session.exec(query).all()
            return list(reminders)

    @staticmethod
    def complete_care_task(reminder_id: int, completion_date: Optional[date] = None) -> bool:
        """Mark a care task as completed."""
        if completion_date is None:
            completion_date = date.today()

        with get_session() as session:
            reminder = session.get(PlantCareReminder, reminder_id)
            if reminder is None:
                return False

            reminder.last_completed = completion_date
            session.add(reminder)
            session.commit()
            return True
