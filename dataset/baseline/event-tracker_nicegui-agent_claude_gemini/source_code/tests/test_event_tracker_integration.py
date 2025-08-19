"""Integration tests for the event tracker application."""

import pytest
from datetime import date, timedelta
from app.database import reset_db
from app.event_service import EventService
from app.models import EventCreate, EventUpdate


@pytest.fixture
def new_db():
    """Reset database before each test."""
    reset_db()
    yield
    reset_db()


def test_complete_event_lifecycle(new_db):
    """Test the complete lifecycle of an event: create, read, update, delete."""

    # 1. Create an event
    event_data = EventCreate(
        title="Integration Test Event", event_date=date.today(), description="Testing complete workflow"
    )

    created_event = EventService.create_event(event_data)
    assert created_event.id is not None
    assert created_event.title == "Integration Test Event"

    # 2. Read the event
    retrieved_event = EventService.get_event_by_id(created_event.id)
    assert retrieved_event is not None
    assert retrieved_event.title == "Integration Test Event"
    assert retrieved_event.description == "Testing complete workflow"

    # 3. Update the event
    update_data = EventUpdate(title="Updated Integration Test", description="Updated description")

    updated_event = EventService.update_event(created_event.id, update_data)
    assert updated_event is not None
    assert updated_event.title == "Updated Integration Test"
    assert updated_event.description == "Updated description"
    assert updated_event.event_date == date.today()  # Should remain unchanged

    # 4. Verify update in list
    all_events = EventService.get_all_events()
    assert len(all_events) == 1
    assert all_events[0].title == "Updated Integration Test"

    # 5. Delete the event
    success = EventService.delete_event(created_event.id)
    assert success

    # 6. Verify deletion
    deleted_event = EventService.get_event_by_id(created_event.id)
    assert deleted_event is None

    all_events_after_delete = EventService.get_all_events()
    assert len(all_events_after_delete) == 0


def test_multiple_events_ordering(new_db):
    """Test that multiple events are correctly ordered by date."""

    today = date.today()
    yesterday = today - timedelta(days=1)
    tomorrow = today + timedelta(days=1)

    # Create events in random order
    event1 = EventService.create_event(EventCreate(title="Today Event", event_date=today))

    event2 = EventService.create_event(EventCreate(title="Future Event", event_date=tomorrow))

    event3 = EventService.create_event(EventCreate(title="Past Event", event_date=yesterday))

    # Verify all events were created
    assert event1.id is not None
    assert event2.id is not None
    assert event3.id is not None

    # Get all events and verify ordering (newest first)
    all_events = EventService.get_all_events()
    assert len(all_events) == 3

    assert all_events[0].title == "Future Event"
    assert all_events[1].title == "Today Event"
    assert all_events[2].title == "Past Event"


def test_search_functionality_integration(new_db):
    """Test search functionality with multiple events."""

    # Create events with different titles and descriptions
    EventService.create_event(
        EventCreate(title="Team Meeting", event_date=date.today(), description="Weekly team sync")
    )

    EventService.create_event(
        EventCreate(title="Client Call", event_date=date.today(), description="Discuss project requirements")
    )

    EventService.create_event(
        EventCreate(title="Team Lunch", event_date=date.today(), description="Monthly team building")
    )

    # Search by title
    team_events = EventService.search_events("Team")
    assert len(team_events) == 2
    titles = [event.title for event in team_events]
    assert "Team Meeting" in titles
    assert "Team Lunch" in titles

    # Search by description
    project_events = EventService.search_events("project")
    assert len(project_events) == 1
    assert project_events[0].title == "Client Call"

    # Search with no results
    no_results = EventService.search_events("nonexistent")
    assert len(no_results) == 0


def test_date_range_filtering(new_db):
    """Test filtering events by date range."""

    today = date.today()
    week_ago = today - timedelta(days=7)
    week_ahead = today + timedelta(days=7)
    month_ahead = today + timedelta(days=30)

    # Create events across different dates
    EventService.create_event(EventCreate(title="Past Event", event_date=week_ago))

    EventService.create_event(EventCreate(title="Today Event", event_date=today))

    EventService.create_event(EventCreate(title="Next Week Event", event_date=week_ahead))

    EventService.create_event(EventCreate(title="Next Month Event", event_date=month_ahead))

    # Get events in next two weeks
    upcoming_events = EventService.get_events_by_date_range(today, week_ahead)
    assert len(upcoming_events) == 2

    titles = [event.title for event in upcoming_events]
    assert "Today Event" in titles
    assert "Next Week Event" in titles
    assert "Past Event" not in titles
    assert "Next Month Event" not in titles


def test_edge_cases(new_db):
    """Test edge cases and error handling."""

    # Test with minimal data
    minimal_event = EventService.create_event(
        EventCreate(
            title="Minimal Event",
            event_date=date.today(),
            # No description provided
        )
    )

    assert minimal_event.description == ""

    # Test updating non-existent event
    non_existent_update = EventService.update_event(999, EventUpdate(title="New Title"))
    assert non_existent_update is None

    # Test deleting non-existent event
    non_existent_delete = EventService.delete_event(999)
    assert not non_existent_delete

    # Test getting non-existent event
    non_existent_get = EventService.get_event_by_id(999)
    assert non_existent_get is None
