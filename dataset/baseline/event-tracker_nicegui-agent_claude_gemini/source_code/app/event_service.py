from datetime import datetime, date
from typing import List, Optional
from sqlmodel import select, desc, func
from app.database import get_session
from app.models import Event, EventCreate, EventUpdate


class EventService:
    """Service layer for event management operations."""

    @staticmethod
    def create_event(event_data: EventCreate) -> Event:
        """Create a new event."""
        with get_session() as session:
            event = Event(**event_data.model_dump())
            event.created_at = datetime.utcnow()
            event.updated_at = datetime.utcnow()
            session.add(event)
            session.commit()
            session.refresh(event)
            return event

    @staticmethod
    def get_all_events() -> List[Event]:
        """Get all events ordered by event date."""
        with get_session() as session:
            statement = select(Event).order_by(desc(Event.event_date))
            events = session.exec(statement).all()
            return list(events)

    @staticmethod
    def get_event_by_id(event_id: int) -> Optional[Event]:
        """Get a specific event by ID."""
        with get_session() as session:
            return session.get(Event, event_id)

    @staticmethod
    def update_event(event_id: int, event_data: EventUpdate) -> Optional[Event]:
        """Update an existing event."""
        with get_session() as session:
            event = session.get(Event, event_id)
            if event is None:
                return None

            update_data = event_data.model_dump(exclude_unset=True)
            if update_data:
                for field, value in update_data.items():
                    setattr(event, field, value)
                event.updated_at = datetime.utcnow()
                session.add(event)
                session.commit()
                session.refresh(event)
            return event

    @staticmethod
    def delete_event(event_id: int) -> bool:
        """Delete an event by ID. Returns True if deleted, False if not found."""
        with get_session() as session:
            event = session.get(Event, event_id)
            if event is None:
                return False
            session.delete(event)
            session.commit()
            return True

    @staticmethod
    def get_events_by_date_range(start_date: date, end_date: date) -> List[Event]:
        """Get events within a specific date range."""
        with get_session() as session:
            statement = (
                select(Event)
                .where(Event.event_date >= start_date, Event.event_date <= end_date)
                .order_by(desc(Event.event_date))
            )
            events = session.exec(statement).all()
            return list(events)

    @staticmethod
    def search_events(query: str) -> List[Event]:
        """Search events by title or description."""
        with get_session() as session:
            # Use case-insensitive search with LOWER function
            query_lower = query.lower()
            statement = (
                select(Event)
                .where(
                    (func.lower(Event.title).contains(query_lower))
                    | (func.lower(Event.description).contains(query_lower))
                )
                .order_by(desc(Event.event_date))
            )
            events = session.exec(statement).all()
            return list(events)
