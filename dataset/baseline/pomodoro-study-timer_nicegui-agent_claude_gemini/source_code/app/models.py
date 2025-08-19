from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime, date
from typing import Optional, List
from enum import Enum


class SessionType(str, Enum):
    WORK = "work"
    SHORT_BREAK = "short_break"
    LONG_BREAK = "long_break"


class SessionStatus(str, Enum):
    ACTIVE = "active"
    COMPLETED = "completed"
    PAUSED = "paused"
    CANCELLED = "cancelled"


# Persistent models (stored in database)
class PomodoroSettings(SQLModel, table=True):
    """User's Pomodoro timer configuration settings"""

    __tablename__ = "pomodoro_settings"  # type: ignore[assignment]

    id: Optional[int] = Field(default=None, primary_key=True)
    work_duration_minutes: int = Field(default=25, ge=1, le=120)  # 1-120 minutes
    short_break_duration_minutes: int = Field(default=5, ge=1, le=60)  # 1-60 minutes
    long_break_duration_minutes: int = Field(default=15, ge=1, le=60)  # 1-60 minutes
    sessions_before_long_break: int = Field(default=4, ge=1, le=10)  # 1-10 sessions
    audio_enabled: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    sessions: List["PomodoroSession"] = Relationship(back_populates="settings")


class PomodoroSession(SQLModel, table=True):
    """Individual Pomodoro session log entry"""

    __tablename__ = "pomodoro_sessions"  # type: ignore[assignment]

    id: Optional[int] = Field(default=None, primary_key=True)
    session_type: SessionType = Field(index=True)
    status: SessionStatus = Field(default=SessionStatus.ACTIVE, index=True)
    planned_duration_minutes: int = Field(ge=1)  # Original planned duration
    actual_duration_minutes: Optional[int] = Field(default=None, ge=0)  # Actual time spent
    started_at: datetime = Field(default_factory=datetime.utcnow, index=True)
    ended_at: Optional[datetime] = Field(default=None)
    session_date: date = Field(default_factory=date.today, index=True)  # For daily aggregation
    notes: Optional[str] = Field(default=None, max_length=500)
    settings_id: int = Field(foreign_key="pomodoro_settings.id")

    settings: PomodoroSettings = Relationship(back_populates="sessions")


class DailyStats(SQLModel, table=True):
    """Daily aggregated statistics for Pomodoro sessions"""

    __tablename__ = "daily_stats"  # type: ignore[assignment]

    id: Optional[int] = Field(default=None, primary_key=True)
    stats_date: date = Field(unique=True, index=True)
    completed_work_sessions: int = Field(default=0, ge=0)
    completed_short_breaks: int = Field(default=0, ge=0)
    completed_long_breaks: int = Field(default=0, ge=0)
    total_work_minutes: int = Field(default=0, ge=0)
    total_break_minutes: int = Field(default=0, ge=0)
    paused_sessions: int = Field(default=0, ge=0)
    cancelled_sessions: int = Field(default=0, ge=0)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


# Non-persistent schemas (for validation, forms, API requests/responses)
class PomodoroSettingsCreate(SQLModel, table=False):
    """Schema for creating new Pomodoro settings"""

    work_duration_minutes: int = Field(default=25, ge=1, le=120)
    short_break_duration_minutes: int = Field(default=5, ge=1, le=60)
    long_break_duration_minutes: int = Field(default=15, ge=1, le=60)
    sessions_before_long_break: int = Field(default=4, ge=1, le=10)
    audio_enabled: bool = Field(default=True)


class PomodoroSettingsUpdate(SQLModel, table=False):
    """Schema for updating Pomodoro settings"""

    work_duration_minutes: Optional[int] = Field(default=None, ge=1, le=120)
    short_break_duration_minutes: Optional[int] = Field(default=None, ge=1, le=60)
    long_break_duration_minutes: Optional[int] = Field(default=None, ge=1, le=60)
    sessions_before_long_break: Optional[int] = Field(default=None, ge=1, le=10)
    audio_enabled: Optional[bool] = Field(default=None)


class PomodoroSessionCreate(SQLModel, table=False):
    """Schema for creating a new Pomodoro session"""

    session_type: SessionType
    planned_duration_minutes: int = Field(ge=1)
    settings_id: int
    status: SessionStatus = Field(default=SessionStatus.ACTIVE)
    notes: Optional[str] = Field(default=None, max_length=500)


class PomodoroSessionUpdate(SQLModel, table=False):
    """Schema for updating a Pomodoro session"""

    status: Optional[SessionStatus] = Field(default=None)
    actual_duration_minutes: Optional[int] = Field(default=None, ge=0)
    ended_at: Optional[datetime] = Field(default=None)
    notes: Optional[str] = Field(default=None, max_length=500)


class TimerState(SQLModel, table=False):
    """Schema for current timer state (non-persistent)"""

    is_running: bool = Field(default=False)
    is_paused: bool = Field(default=False)
    current_session_type: Optional[SessionType] = Field(default=None)
    remaining_seconds: int = Field(default=0, ge=0)
    total_seconds: int = Field(default=0, ge=0)
    current_session_id: Optional[int] = Field(default=None)
    sessions_completed_today: int = Field(default=0, ge=0)
    work_sessions_in_cycle: int = Field(default=0, ge=0)  # Track sessions in current cycle for long break


class DailyStatsResponse(SQLModel, table=False):
    """Schema for daily statistics response"""

    stats_date: date
    completed_work_sessions: int
    completed_short_breaks: int
    completed_long_breaks: int
    total_work_minutes: int
    total_break_minutes: int
    paused_sessions: int
    cancelled_sessions: int
    productivity_percentage: float = Field(ge=0, le=100)  # Calculated field


class SessionHistoryResponse(SQLModel, table=False):
    """Schema for session history response"""

    id: int
    session_type: SessionType
    status: SessionStatus
    planned_duration_minutes: int
    actual_duration_minutes: Optional[int]
    started_at: datetime
    ended_at: Optional[datetime]
    session_date: date
    notes: Optional[str]
    efficiency_percentage: Optional[float] = Field(default=None, ge=0, le=100)  # Calculated field
