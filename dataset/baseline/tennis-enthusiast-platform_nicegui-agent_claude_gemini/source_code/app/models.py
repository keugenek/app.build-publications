from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime
from typing import Optional, List
from enum import Enum


class SkillLevel(str, Enum):
    """Skill levels for tennis players."""

    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"


class Player(SQLModel, table=True):
    """Tennis player profile model."""

    __tablename__ = "players"  # type: ignore[assignment]

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(max_length=100, description="Player's full name")
    email: str = Field(unique=True, max_length=255, regex=r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")
    skill_level: SkillLevel = Field(description="Tennis skill level")
    location: str = Field(max_length=200, description="Player's location for matching")
    bio: str = Field(default="", max_length=500, description="Optional bio/description")
    is_active: bool = Field(default=True, description="Whether player is actively seeking matches")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    sent_match_requests: List["MatchRequest"] = Relationship(
        back_populates="requester", sa_relationship_kwargs={"foreign_keys": "MatchRequest.requester_id"}
    )
    received_match_requests: List["MatchRequest"] = Relationship(
        back_populates="requested", sa_relationship_kwargs={"foreign_keys": "MatchRequest.requested_id"}
    )


class MatchRequestStatus(str, Enum):
    """Status options for match requests."""

    PENDING = "pending"
    ACCEPTED = "accepted"
    DECLINED = "declined"
    CANCELLED = "cancelled"


class MatchRequest(SQLModel, table=True):
    """Model for match requests between players."""

    __tablename__ = "match_requests"  # type: ignore[assignment]

    id: Optional[int] = Field(default=None, primary_key=True)
    requester_id: int = Field(foreign_key="players.id", description="Player who sent the request")
    requested_id: int = Field(foreign_key="players.id", description="Player who received the request")
    message: str = Field(default="", max_length=500, description="Optional message with the request")
    proposed_date: Optional[datetime] = Field(default=None, description="Proposed match date/time")
    location_suggestion: str = Field(default="", max_length=200, description="Suggested match location")
    status: MatchRequestStatus = Field(default=MatchRequestStatus.PENDING)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    requester: Player = Relationship(
        back_populates="sent_match_requests", sa_relationship_kwargs={"foreign_keys": "MatchRequest.requester_id"}
    )
    requested: Player = Relationship(
        back_populates="received_match_requests", sa_relationship_kwargs={"foreign_keys": "MatchRequest.requested_id"}
    )


# Non-persistent schemas for validation and API


class PlayerCreate(SQLModel, table=False):
    """Schema for creating a new player profile."""

    name: str = Field(max_length=100)
    email: str = Field(max_length=255)
    skill_level: SkillLevel
    location: str = Field(max_length=200)
    bio: str = Field(default="", max_length=500)


class PlayerUpdate(SQLModel, table=False):
    """Schema for updating player profile."""

    name: Optional[str] = Field(default=None, max_length=100)
    skill_level: Optional[SkillLevel] = Field(default=None)
    location: Optional[str] = Field(default=None, max_length=200)
    bio: Optional[str] = Field(default=None, max_length=500)
    is_active: Optional[bool] = Field(default=None)


class PlayerSearch(SQLModel, table=False):
    """Schema for searching players."""

    location: Optional[str] = Field(default=None, max_length=200)
    skill_level: Optional[SkillLevel] = Field(default=None)
    is_active: Optional[bool] = Field(default=True)


class MatchRequestCreate(SQLModel, table=False):
    """Schema for creating a match request."""

    requested_id: int
    message: str = Field(default="", max_length=500)
    proposed_date: Optional[datetime] = Field(default=None)
    location_suggestion: str = Field(default="", max_length=200)


class MatchRequestUpdate(SQLModel, table=False):
    """Schema for updating a match request."""

    status: Optional[MatchRequestStatus] = Field(default=None)
    proposed_date: Optional[datetime] = Field(default=None)
    location_suggestion: Optional[str] = Field(default=None, max_length=200)


class PlayerPublic(SQLModel, table=False):
    """Public player profile for search results."""

    id: int
    name: str
    skill_level: SkillLevel
    location: str
    bio: str
    is_active: bool
    created_at: datetime
