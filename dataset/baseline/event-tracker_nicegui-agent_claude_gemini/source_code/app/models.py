from sqlmodel import SQLModel, Field
from datetime import datetime, date
from typing import Optional


# Persistent models (stored in database)
class Event(SQLModel, table=True):
    __tablename__ = "events"  # type: ignore[assignment]

    id: Optional[int] = Field(default=None, primary_key=True)
    title: str = Field(max_length=200)
    event_date: date = Field()
    description: str = Field(default="", max_length=1000)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


# Non-persistent schemas (for validation, forms, API requests/responses)
class EventCreate(SQLModel, table=False):
    title: str = Field(max_length=200)
    event_date: date = Field()
    description: str = Field(default="", max_length=1000)


class EventUpdate(SQLModel, table=False):
    title: Optional[str] = Field(default=None, max_length=200)
    event_date: Optional[date] = Field(default=None)
    description: Optional[str] = Field(default=None, max_length=1000)


class EventResponse(SQLModel, table=False):
    id: int
    title: str
    event_date: date
    description: str
    created_at: datetime
    updated_at: datetime
