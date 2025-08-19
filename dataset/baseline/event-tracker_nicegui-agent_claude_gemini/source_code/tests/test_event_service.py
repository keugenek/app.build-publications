import pytest
from datetime import date, datetime, timedelta
from app.event_service import EventService
from app.models import EventCreate, EventUpdate
from app.database import reset_db


@pytest.fixture
def new_db():
    """Reset database before each test."""
    reset_db()
    yield
    reset_db()


def test_create_event(new_db):
    """Test creating a new event."""
    event_data = EventCreate(title="Team Meeting", event_date=date.today(), description="Weekly team sync")

    event = EventService.create_event(event_data)

    assert event.id is not None
    assert event.title == "Team Meeting"
    assert event.event_date == date.today()
    assert event.description == "Weekly team sync"
    assert isinstance(event.created_at, datetime)
    assert isinstance(event.updated_at, datetime)


def test_create_event_minimal_data(new_db):
    """Test creating event with minimal required data."""
    event_data = EventCreate(title="Simple Event", event_date=date.today())

    event = EventService.create_event(event_data)

    assert event.title == "Simple Event"
    assert event.description == ""  # Default empty string


def test_get_all_events_empty(new_db):
    """Test getting all events when none exist."""
    events = EventService.get_all_events()
    assert events == []


def test_get_all_events_ordered_by_date(new_db):
    """Test that events are returned ordered by date (newest first)."""
    today = date.today()
    yesterday = today - timedelta(days=1)
    tomorrow = today + timedelta(days=1)

    # Create events in random order
    EventService.create_event(EventCreate(title="Today Event", event_date=today))
    EventService.create_event(EventCreate(title="Tomorrow Event", event_date=tomorrow))
    EventService.create_event(EventCreate(title="Yesterday Event", event_date=yesterday))

    events = EventService.get_all_events()

    assert len(events) == 3
    assert events[0].title == "Tomorrow Event"  # Newest first
    assert events[1].title == "Today Event"
    assert events[2].title == "Yesterday Event"


def test_get_event_by_id(new_db):
    """Test getting event by ID."""
    event_data = EventCreate(title="Test Event", event_date=date.today())
    created_event = EventService.create_event(event_data)

    if created_event.id is not None:
        retrieved_event = EventService.get_event_by_id(created_event.id)
        assert retrieved_event is not None
        assert retrieved_event.id == created_event.id
        assert retrieved_event.title == "Test Event"


def test_get_event_by_id_not_found(new_db):
    """Test getting non-existent event."""
    event = EventService.get_event_by_id(999)
    assert event is None


def test_update_event(new_db):
    """Test updating an existing event."""
    # Create event
    event_data = EventCreate(title="Original Title", event_date=date.today())
    created_event = EventService.create_event(event_data)
    original_updated_at = created_event.updated_at

    if created_event.id is not None:
        # Update event
        update_data = EventUpdate(title="Updated Title", description="Updated description")
        updated_event = EventService.update_event(created_event.id, update_data)

        assert updated_event is not None
        assert updated_event.title == "Updated Title"
        assert updated_event.description == "Updated description"
        assert updated_event.event_date == date.today()  # Unchanged
        assert updated_event.updated_at > original_updated_at


def test_update_event_partial(new_db):
    """Test partial update of event."""
    # Create event
    event_data = EventCreate(title="Original Title", event_date=date.today(), description="Original description")
    created_event = EventService.create_event(event_data)

    if created_event.id is not None:
        # Update only title
        update_data = EventUpdate(title="New Title")
        updated_event = EventService.update_event(created_event.id, update_data)

        assert updated_event is not None
        assert updated_event.title == "New Title"
        assert updated_event.description == "Original description"  # Unchanged


def test_update_event_not_found(new_db):
    """Test updating non-existent event."""
    update_data = EventUpdate(title="New Title")
    result = EventService.update_event(999, update_data)
    assert result is None


def test_delete_event(new_db):
    """Test deleting an event."""
    # Create event
    event_data = EventCreate(title="To Delete", event_date=date.today())
    created_event = EventService.create_event(event_data)

    if created_event.id is not None:
        # Delete event
        success = EventService.delete_event(created_event.id)
        assert success

        # Verify deletion
        deleted_event = EventService.get_event_by_id(created_event.id)
        assert deleted_event is None


def test_delete_event_not_found(new_db):
    """Test deleting non-existent event."""
    success = EventService.delete_event(999)
    assert not success


def test_get_events_by_date_range(new_db):
    """Test getting events within a date range."""
    today = date.today()
    yesterday = today - timedelta(days=1)
    tomorrow = today + timedelta(days=1)
    next_week = today + timedelta(days=7)

    # Create events
    EventService.create_event(EventCreate(title="Yesterday", event_date=yesterday))
    EventService.create_event(EventCreate(title="Today", event_date=today))
    EventService.create_event(EventCreate(title="Tomorrow", event_date=tomorrow))
    EventService.create_event(EventCreate(title="Next Week", event_date=next_week))

    # Get events from today to tomorrow
    events = EventService.get_events_by_date_range(today, tomorrow)

    assert len(events) == 2
    titles = [event.title for event in events]
    assert "Today" in titles
    assert "Tomorrow" in titles
    assert "Yesterday" not in titles
    assert "Next Week" not in titles


def test_search_events_by_title(new_db):
    """Test searching events by title."""
    EventService.create_event(EventCreate(title="Team Meeting", event_date=date.today()))
    EventService.create_event(EventCreate(title="Client Call", event_date=date.today()))
    EventService.create_event(EventCreate(title="Team Lunch", event_date=date.today()))

    events = EventService.search_events("Team")

    assert len(events) == 2
    titles = [event.title for event in events]
    assert "Team Meeting" in titles
    assert "Team Lunch" in titles
    assert "Client Call" not in titles


def test_search_events_by_description(new_db):
    """Test searching events by description."""
    EventService.create_event(
        EventCreate(title="Meeting", event_date=date.today(), description="Discuss project timeline")
    )
    EventService.create_event(
        EventCreate(title="Call", event_date=date.today(), description="Client requirements review")
    )

    events = EventService.search_events("project")

    assert len(events) == 1
    assert events[0].title == "Meeting"


def test_search_events_no_results(new_db):
    """Test searching with no matching results."""
    EventService.create_event(EventCreate(title="Meeting", event_date=date.today()))

    events = EventService.search_events("nonexistent")
    assert events == []
