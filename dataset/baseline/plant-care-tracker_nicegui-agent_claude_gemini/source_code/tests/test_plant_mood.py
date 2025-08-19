"""Tests for plant mood calculation logic."""

from datetime import date, timedelta
from app.models import Plant, PlantType, PlantMood


def test_plant_mood_never_watered():
    """Test mood when plant has never been watered."""
    plant = Plant(
        name="Test Plant",
        plant_type=PlantType.TROPICAL,
        location="Test Room",
        watering_frequency_days=7,
        last_watered=None,
    )

    assert plant.calculate_mood() == PlantMood.THIRSTY


def test_plant_mood_just_watered():
    """Test mood when plant was watered today."""
    plant = Plant(
        name="Fresh Plant",
        plant_type=PlantType.SUCCULENT,
        location="Sunny Window",
        watering_frequency_days=10,
        last_watered=date.today(),
    )

    assert plant.calculate_mood() == PlantMood.HAPPY


def test_plant_mood_content_range():
    """Test mood when plant is in the content range (within 70% of frequency)."""
    plant = Plant(
        name="Content Plant",
        plant_type=PlantType.HERB,
        location="Kitchen",
        watering_frequency_days=10,  # 70% = 7 days
        last_watered=date.today() - timedelta(days=5),  # 5 days ago, within 7
    )

    assert plant.calculate_mood() == PlantMood.CONTENT


def test_plant_mood_thirsty():
    """Test mood when plant is getting thirsty (between 70% and 100% of frequency)."""
    plant = Plant(
        name="Getting Thirsty Plant",
        plant_type=PlantType.TROPICAL,
        location="Living Room",
        watering_frequency_days=10,
        last_watered=date.today() - timedelta(days=8),  # 8 days ago, between 7 and 10
    )

    assert plant.calculate_mood() == PlantMood.THIRSTY


def test_plant_mood_dying():
    """Test mood when plant is seriously dehydrated (between 100% and 200% of frequency)."""
    plant = Plant(
        name="Dehydrated Plant",
        plant_type=PlantType.FERN,
        location="Bathroom",
        watering_frequency_days=7,
        last_watered=date.today() - timedelta(days=10),  # 10 days ago, between 7 and 14
    )

    assert plant.calculate_mood() == PlantMood.DYING


def test_plant_mood_drowning():
    """Test mood when plant is severely neglected (over 200% of frequency)."""
    plant = Plant(
        name="Severely Neglected Plant",
        plant_type=PlantType.CACTUS,
        location="Forgotten Corner",
        watering_frequency_days=14,
        last_watered=date.today() - timedelta(days=30),  # 30 days ago, over 28 (2x frequency)
    )

    assert plant.calculate_mood() == PlantMood.DROWNING


def test_plant_mood_future_date():
    """Test mood handling when last_watered is in the future (edge case)."""
    plant = Plant(
        name="Time Traveler Plant",
        plant_type=PlantType.TROPICAL,
        location="Future Room",
        watering_frequency_days=7,
        last_watered=date.today() + timedelta(days=1),  # Tomorrow
    )

    # Should handle gracefully and return content
    assert plant.calculate_mood() == PlantMood.CONTENT


def test_days_since_watered():
    """Test calculation of days since watering."""
    # Plant watered 3 days ago
    plant = Plant(
        name="Test Plant",
        plant_type=PlantType.HERB,
        location="Kitchen",
        watering_frequency_days=5,
        last_watered=date.today() - timedelta(days=3),
    )

    assert plant.days_since_watered() == 3

    # Plant never watered
    plant.last_watered = None
    assert plant.days_since_watered() is None


def test_next_watering_date():
    """Test calculation of next watering date."""
    # Plant watered 2 days ago with 7-day frequency
    plant = Plant(
        name="Scheduled Plant",
        plant_type=PlantType.TROPICAL,
        location="Study",
        watering_frequency_days=7,
        last_watered=date.today() - timedelta(days=2),
    )

    expected_next = date.today() + timedelta(days=5)  # 7 days from last watering
    assert plant.next_watering_date() == expected_next

    # Plant never watered
    plant.last_watered = None
    assert plant.next_watering_date() == date.today()


def test_is_due_for_watering():
    """Test checking if plant is due for watering."""
    # Plant that should be watered today
    plant = Plant(
        name="Due Today Plant",
        plant_type=PlantType.SUCCULENT,
        location="Window",
        watering_frequency_days=5,
        last_watered=date.today() - timedelta(days=5),  # Exactly 5 days ago
    )

    assert plant.is_due_for_watering()

    # Plant that's overdue
    plant.last_watered = date.today() - timedelta(days=7)  # 7 days ago
    assert plant.is_due_for_watering()

    # Plant that's not due yet
    plant.last_watered = date.today() - timedelta(days=2)  # 2 days ago
    assert not plant.is_due_for_watering()

    # Plant never watered
    plant.last_watered = None
    assert plant.is_due_for_watering()


def test_mood_property():
    """Test that the mood property works correctly."""
    plant = Plant(
        name="Property Test Plant",
        plant_type=PlantType.FLOWERING,
        location="Garden",
        watering_frequency_days=7,
        last_watered=date.today(),
    )

    # Should return the same as calculate_mood()
    assert plant.mood == plant.calculate_mood()
    assert plant.mood == PlantMood.HAPPY


def test_different_plant_types_same_logic():
    """Test that mood calculation is consistent across plant types."""
    plant_types = [
        PlantType.TROPICAL,
        PlantType.SUCCULENT,
        PlantType.HERB,
        PlantType.CACTUS,
        PlantType.FERN,
        PlantType.FLOWERING,
        PlantType.TREE,
    ]

    for plant_type in plant_types:
        plant = Plant(
            name=f"Test {plant_type.value}",
            plant_type=plant_type,
            location="Test Room",
            watering_frequency_days=7,
            last_watered=date.today(),
        )

        # All should be happy when just watered
        assert plant.calculate_mood() == PlantMood.HAPPY

        # All should be thirsty when never watered
        plant.last_watered = None
        assert plant.calculate_mood() == PlantMood.THIRSTY


def test_edge_case_frequencies():
    """Test mood calculation with edge case watering frequencies."""
    # Very frequent watering (daily)
    daily_plant = Plant(
        name="Daily Plant",
        plant_type=PlantType.HERB,
        location="Greenhouse",
        watering_frequency_days=1,
        last_watered=date.today() - timedelta(days=2),  # 2 days overdue
    )

    assert daily_plant.calculate_mood() == PlantMood.DYING  # Way overdue relative to frequency

    # Very infrequent watering (monthly)
    monthly_plant = Plant(
        name="Monthly Plant",
        plant_type=PlantType.CACTUS,
        location="Desert Room",
        watering_frequency_days=30,
        last_watered=date.today() - timedelta(days=20),  # 20 days, within 70% of 30
    )

    assert monthly_plant.calculate_mood() == PlantMood.CONTENT


def test_boundary_conditions():
    """Test mood calculation at exact boundary conditions."""
    plant = Plant(
        name="Boundary Plant",
        plant_type=PlantType.TROPICAL,
        location="Test Room",
        watering_frequency_days=10,
        last_watered=None,
    )

    # Test exact boundaries
    test_cases = [
        (0, PlantMood.HAPPY),  # Today
        (7, PlantMood.CONTENT),  # Exactly 70% of frequency
        (10, PlantMood.THIRSTY),  # Exactly at frequency
        (20, PlantMood.DYING),  # Exactly 2x frequency
        (21, PlantMood.DROWNING),  # Just over 2x frequency
    ]

    for days_ago, expected_mood in test_cases:
        if days_ago == 0:
            plant.last_watered = date.today()
        else:
            plant.last_watered = date.today() - timedelta(days=days_ago)

        actual_mood = plant.calculate_mood()
        assert actual_mood == expected_mood, f"Expected {expected_mood} for {days_ago} days ago, got {actual_mood}"
