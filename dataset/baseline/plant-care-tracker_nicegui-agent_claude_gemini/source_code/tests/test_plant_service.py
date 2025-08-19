"""Tests for plant service operations with proper null handling."""

import pytest
from datetime import date, timedelta
from app.plant_service import PlantService
from app.models import PlantCreate, PlantUpdate, WateringRecordCreate, PlantType, PlantMood
from app.database import reset_db


@pytest.fixture()
def new_db():
    """Fresh database for each test."""
    reset_db()
    yield
    reset_db()


def test_create_plant(new_db):
    """Test creating a new plant."""
    plant_data = PlantCreate(
        name="Test Monstera",
        plant_type=PlantType.TROPICAL,
        location="Living Room",
        watering_frequency_days=7,
        notes="Beautiful plant",
    )

    plant = PlantService.create_plant(plant_data)

    assert plant.name == "Test Monstera"
    assert plant.plant_type == PlantType.TROPICAL
    assert plant.location == "Living Room"
    assert plant.watering_frequency_days == 7
    assert plant.notes == "Beautiful plant"
    assert plant.is_active
    assert plant.id is not None


def test_get_all_active_plants(new_db):
    """Test retrieving all active plants."""
    # Initially empty
    plants = PlantService.get_all_active_plants()
    assert len(plants) == 0

    # Add some plants
    plant1_data = PlantCreate(name="Plant 1", location="Room 1", plant_type=PlantType.SUCCULENT)
    plant2_data = PlantCreate(name="Plant 2", location="Room 2", plant_type=PlantType.TROPICAL)

    PlantService.create_plant(plant1_data)
    PlantService.create_plant(plant2_data)

    plants = PlantService.get_all_active_plants()
    assert len(plants) == 2
    assert plants[0].name in ["Plant 1", "Plant 2"]
    assert plants[1].name in ["Plant 1", "Plant 2"]


def test_get_plant_by_id(new_db):
    """Test retrieving a plant by ID."""
    plant_data = PlantCreate(name="Test Plant", location="Test Location", plant_type=PlantType.HERB)
    created_plant = PlantService.create_plant(plant_data)

    assert created_plant.id is not None

    # Valid ID
    retrieved_plant = PlantService.get_plant_by_id(created_plant.id)
    assert retrieved_plant is not None
    assert retrieved_plant.name == "Test Plant"
    assert retrieved_plant.id == created_plant.id

    # Invalid ID
    invalid_plant = PlantService.get_plant_by_id(999)
    assert invalid_plant is None


def test_update_plant(new_db):
    """Test updating an existing plant."""
    plant_data = PlantCreate(name="Original Name", location="Original Location", plant_type=PlantType.CACTUS)
    created_plant = PlantService.create_plant(plant_data)

    assert created_plant.id is not None

    # Update some fields
    update_data = PlantUpdate(name="Updated Name", watering_frequency_days=14, notes="Updated notes")

    updated_plant = PlantService.update_plant(created_plant.id, update_data)

    assert updated_plant is not None
    assert updated_plant.name == "Updated Name"
    assert updated_plant.location == "Original Location"  # Unchanged
    assert updated_plant.watering_frequency_days == 14
    assert updated_plant.notes == "Updated notes"
    assert updated_plant.updated_at is not None

    # Update non-existent plant
    invalid_update = PlantService.update_plant(999, update_data)
    assert invalid_update is None


def test_delete_plant(new_db):
    """Test soft deleting a plant."""
    plant_data = PlantCreate(name="Plant to Delete", location="Test Location", plant_type=PlantType.FERN)
    created_plant = PlantService.create_plant(plant_data)

    assert created_plant.id is not None

    # Delete the plant
    success = PlantService.delete_plant(created_plant.id)
    assert success

    # Plant should not appear in active plants
    active_plants = PlantService.get_all_active_plants()
    assert len(active_plants) == 0

    # But should still exist in database with is_active=False
    deleted_plant = PlantService.get_plant_by_id(created_plant.id)
    assert deleted_plant is None  # Service returns None for inactive plants

    # Delete non-existent plant
    invalid_delete = PlantService.delete_plant(999)
    assert not invalid_delete


def test_water_plant(new_db):
    """Test recording watering events."""
    plant_data = PlantCreate(name="Thirsty Plant", location="Kitchen", plant_type=PlantType.HERB)
    created_plant = PlantService.create_plant(plant_data)

    assert created_plant.id is not None

    # Water the plant
    watering_data = WateringRecordCreate(
        plant_id=created_plant.id, watered_date=date.today(), amount_ml=250, notes="Morning watering"
    )

    updated_plant = PlantService.water_plant(created_plant.id, watering_data)

    assert updated_plant is not None
    assert updated_plant.last_watered == date.today()
    assert updated_plant.mood in [PlantMood.HAPPY, PlantMood.CONTENT]

    # Water non-existent plant
    invalid_watering = PlantService.water_plant(999, watering_data)
    assert invalid_watering is None


def test_get_watering_history(new_db):
    """Test retrieving watering history."""
    plant_data = PlantCreate(name="Well Watered Plant", location="Garden", plant_type=PlantType.FLOWERING)
    created_plant = PlantService.create_plant(plant_data)

    assert created_plant.id is not None

    # Add multiple watering records
    dates = [date.today() - timedelta(days=i) for i in range(5)]
    for i, watering_date in enumerate(dates):
        watering_data = WateringRecordCreate(
            plant_id=created_plant.id, watered_date=watering_date, amount_ml=200 + i * 50, notes=f"Watering {i + 1}"
        )
        PlantService.water_plant(created_plant.id, watering_data)

    # Get history
    history = PlantService.get_watering_history(created_plant.id, limit=3)

    assert len(history) == 3
    # Should be ordered by date descending (most recent first)
    assert history[0].watered_date == dates[0]  # Today
    assert history[1].watered_date == dates[1]  # Yesterday
    assert history[2].watered_date == dates[2]  # Day before yesterday


def test_plant_mood_calculation(new_db):
    """Test plant mood calculation based on watering schedule."""
    plant_data = PlantCreate(
        name="Mood Test Plant", location="Test Room", plant_type=PlantType.TROPICAL, watering_frequency_days=7
    )
    created_plant = PlantService.create_plant(plant_data)

    assert created_plant.id is not None

    # Never watered - should be thirsty
    plant = PlantService.get_plant_by_id(created_plant.id)
    assert plant is not None
    assert plant.mood == PlantMood.THIRSTY

    # Just watered - should be happy
    watering_data = WateringRecordCreate(plant_id=created_plant.id, watered_date=date.today(), notes="Fresh watering")
    updated_plant = PlantService.water_plant(created_plant.id, watering_data)
    assert updated_plant is not None
    assert updated_plant.mood == PlantMood.HAPPY

    # Watered a few days ago - should be content
    few_days_ago = date.today() - timedelta(days=3)
    watering_data.watered_date = few_days_ago
    PlantService.water_plant(created_plant.id, watering_data)
    refreshed_plant = PlantService.get_plant_by_id(created_plant.id)
    assert refreshed_plant is not None
    assert refreshed_plant.mood == PlantMood.CONTENT

    # Overdue - should be thirsty or dying
    overdue_date = date.today() - timedelta(days=8)
    watering_data.watered_date = overdue_date
    PlantService.water_plant(created_plant.id, watering_data)
    refreshed_plant = PlantService.get_plant_by_id(created_plant.id)
    assert refreshed_plant is not None
    assert refreshed_plant.mood in [PlantMood.THIRSTY, PlantMood.DYING]


def test_get_plants_needing_water(new_db):
    """Test filtering plants that need watering."""
    # Create plants with different watering schedules
    plant1_data = PlantCreate(name="Recent Plant", location="Room 1", watering_frequency_days=7)
    plant2_data = PlantCreate(name="Overdue Plant", location="Room 2", watering_frequency_days=3)

    plant1 = PlantService.create_plant(plant1_data)
    plant2 = PlantService.create_plant(plant2_data)

    assert plant1.id is not None
    assert plant2.id is not None

    # Water plant1 recently
    recent_watering = WateringRecordCreate(
        plant_id=plant1.id, watered_date=date.today() - timedelta(days=1), notes="Recent watering"
    )
    PlantService.water_plant(plant1.id, recent_watering)

    # Water plant2 way overdue
    overdue_watering = WateringRecordCreate(
        plant_id=plant2.id, watered_date=date.today() - timedelta(days=5), notes="Old watering"
    )
    PlantService.water_plant(plant2.id, overdue_watering)

    # Check which plants need water
    plants_needing_water = PlantService.get_plants_needing_water()
    plant_names = [p.name for p in plants_needing_water]

    # plant2 should need water (5 days ago, frequency 3 days)
    assert "Overdue Plant" in plant_names


def test_get_plant_statistics(new_db):
    """Test getting overall plant statistics."""
    # Empty database
    stats = PlantService.get_plant_statistics()
    assert stats["total_plants"] == 0
    assert stats["plants_needing_water"] == 0
    assert stats["happy_plants"] == 0
    assert stats["mood_distribution"] == {}

    # Add some plants
    plant_data_1 = PlantCreate(name="Happy Plant", location="Room 1", watering_frequency_days=7)
    plant_data_2 = PlantCreate(name="Thirsty Plant", location="Room 2", watering_frequency_days=3)

    plant1 = PlantService.create_plant(plant_data_1)
    PlantService.create_plant(plant_data_2)

    assert plant1.id is not None

    # Water one plant recently
    recent_watering = WateringRecordCreate(plant_id=plant1.id, watered_date=date.today(), notes="Fresh watering")
    PlantService.water_plant(plant1.id, recent_watering)

    # Get statistics
    stats = PlantService.get_plant_statistics()

    assert stats["total_plants"] == 2
    assert stats["happy_plants"] >= 1  # At least the recently watered plant
    assert len(stats["mood_distribution"]) > 0
    assert sum(stats["mood_distribution"].values()) == 2  # Total should equal plant count


def test_plants_with_scientific_names(new_db):
    """Test plants with optional scientific names."""
    plant_data = PlantCreate(
        name="Rubber Tree", scientific_name="Ficus elastica", location="Office", plant_type=PlantType.TREE
    )

    plant = PlantService.create_plant(plant_data)
    assert plant.scientific_name == "Ficus elastica"
    assert plant.id is not None

    # Update to remove scientific name
    update_data = PlantUpdate(scientific_name=None)
    updated_plant = PlantService.update_plant(plant.id, update_data)
    assert updated_plant is not None
    assert updated_plant.scientific_name is None


def test_acquired_date_handling(new_db):
    """Test handling of plant acquisition dates."""
    acquisition_date = date(2023, 6, 15)
    plant_data = PlantCreate(
        name="New Addition", location="Bedroom", plant_type=PlantType.SUCCULENT, acquired_date=acquisition_date
    )

    plant = PlantService.create_plant(plant_data)
    assert plant.acquired_date == acquisition_date

    # Plant without acquisition date
    plant_data_2 = PlantCreate(name="Unknown Age", location="Balcony", plant_type=PlantType.CACTUS)
    plant2 = PlantService.create_plant(plant_data_2)
    assert plant2.acquired_date is None


def test_watering_amount_tracking(new_db):
    """Test tracking of watering amounts."""
    plant_data = PlantCreate(name="Measured Plant", location="Kitchen", plant_type=PlantType.HERB)
    plant = PlantService.create_plant(plant_data)

    assert plant.id is not None

    # Water with specific amount
    watering_data = WateringRecordCreate(
        plant_id=plant.id, watered_date=date.today(), amount_ml=350, notes="Measured watering"
    )

    PlantService.water_plant(plant.id, watering_data)

    history = PlantService.get_watering_history(plant.id, limit=1)
    assert len(history) == 1
    assert history[0].amount_ml == 350
    assert history[0].notes == "Measured watering"

    # Water without amount
    watering_data_2 = WateringRecordCreate(
        plant_id=plant.id, watered_date=date.today() - timedelta(days=1), notes="Unmeasured watering"
    )

    PlantService.water_plant(plant.id, watering_data_2)

    history = PlantService.get_watering_history(plant.id, limit=2)
    assert len(history) == 2
    assert history[1].amount_ml is None  # Second record (older)


def test_next_watering_date_calculation(new_db):
    """Test calculation of next watering date."""
    plant_data = PlantCreate(
        name="Scheduled Plant", location="Study", plant_type=PlantType.TROPICAL, watering_frequency_days=5
    )
    plant = PlantService.create_plant(plant_data)

    assert plant.id is not None

    # Never watered - next watering should be today
    retrieved_plant = PlantService.get_plant_by_id(plant.id)
    assert retrieved_plant is not None
    assert retrieved_plant.next_watering_date == date.today()

    # Water the plant
    last_watered = date.today() - timedelta(days=2)
    watering_data = WateringRecordCreate(plant_id=plant.id, watered_date=last_watered)
    PlantService.water_plant(plant.id, watering_data)

    # Next watering should be 5 days from last watering
    updated_plant = PlantService.get_plant_by_id(plant.id)
    assert updated_plant is not None
    expected_next = last_watered + timedelta(days=5)
    assert updated_plant.next_watering_date == expected_next
