"""Simplified UI smoke tests for plant tracking application."""

import pytest
from datetime import date, timedelta
from nicegui.testing import User
from app.database import reset_db
from app.plant_service import PlantService
from app.models import PlantCreate, PlantType


@pytest.fixture()
def new_db():
    """Fresh database for each test."""
    reset_db()
    yield
    reset_db()


async def test_dashboard_loads(user: User, new_db) -> None:
    """Test that dashboard loads without error."""
    await user.open("/")
    await user.should_see("Plant Care Dashboard")


async def test_add_plant_page_loads(user: User, new_db) -> None:
    """Test that add plant page loads."""
    await user.open("/plants/add")
    await user.should_see("Add New Plant")


async def test_watering_page_loads(user: User, new_db) -> None:
    """Test that watering page loads."""
    await user.open("/water")
    await user.should_see("Plant Watering")


async def test_history_page_loads(user: User, new_db) -> None:
    """Test that history page loads."""
    await user.open("/history")
    await user.should_see("Plant Care History")


async def test_dashboard_with_plant_displays(user: User, new_db) -> None:
    """Test dashboard displays plant information."""
    # Create a test plant
    plant_data = PlantCreate(
        name="Test Plant",
        location="Test Room",
        plant_type=PlantType.TROPICAL,
        watering_frequency_days=7,
        last_watered=date.today() - timedelta(days=2),
    )
    PlantService.create_plant(plant_data)

    await user.open("/")

    # Should see plant information
    await user.should_see("Test Plant")
    await user.should_see("Test Room")
