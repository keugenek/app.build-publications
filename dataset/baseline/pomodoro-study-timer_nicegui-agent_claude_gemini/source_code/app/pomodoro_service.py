from datetime import datetime, date
from typing import Optional
from sqlmodel import Session, select

from app.database import ENGINE
from app.models import (
    PomodoroSettings,
    PomodoroSession,
    DailyStats,
    PomodoroSettingsUpdate,
    PomodoroSessionCreate,
    PomodoroSessionUpdate,
    SessionType,
    SessionStatus,
    DailyStatsResponse,
)


class PomodoroService:
    """Service layer for Pomodoro timer business logic"""

    @staticmethod
    def get_or_create_settings() -> PomodoroSettings:
        """Get user settings or create default settings if none exist"""
        with Session(ENGINE) as session:
            settings = session.exec(select(PomodoroSettings)).first()
            if settings is None:
                settings = PomodoroSettings()
                session.add(settings)
                session.commit()
                session.refresh(settings)
            return settings

    @staticmethod
    def update_settings(settings_update: PomodoroSettingsUpdate) -> PomodoroSettings:
        """Update user settings"""
        with Session(ENGINE) as session:
            settings = session.exec(select(PomodoroSettings)).first()
            if settings is None:
                # Create new settings if none exist
                settings = PomodoroSettings()
                session.add(settings)

            # Update only provided fields
            update_data = settings_update.model_dump(exclude_unset=True)
            for field, value in update_data.items():
                setattr(settings, field, value)

            settings.updated_at = datetime.utcnow()
            session.commit()
            session.refresh(settings)
            return settings

    @staticmethod
    def create_session(session_create: PomodoroSessionCreate) -> PomodoroSession:
        """Create a new Pomodoro session"""
        with Session(ENGINE) as session:
            pomodoro_session = PomodoroSession(**session_create.model_dump())
            session.add(pomodoro_session)
            session.commit()
            session.refresh(pomodoro_session)
            return pomodoro_session

    @staticmethod
    def update_session(session_id: int, session_update: PomodoroSessionUpdate) -> Optional[PomodoroSession]:
        """Update an existing Pomodoro session"""
        with Session(ENGINE) as session:
            pomodoro_session = session.get(PomodoroSession, session_id)
            if pomodoro_session is None:
                return None

            update_data = session_update.model_dump(exclude_unset=True)
            for field, value in update_data.items():
                setattr(pomodoro_session, field, value)

            session.commit()
            session.refresh(pomodoro_session)
            return pomodoro_session

    @staticmethod
    def complete_session(session_id: int, actual_duration_minutes: int) -> Optional[PomodoroSession]:
        """Mark a session as completed and update daily stats"""
        with Session(ENGINE) as session:
            pomodoro_session = session.get(PomodoroSession, session_id)
            if pomodoro_session is None:
                return None

            pomodoro_session.status = SessionStatus.COMPLETED
            pomodoro_session.actual_duration_minutes = actual_duration_minutes
            pomodoro_session.ended_at = datetime.utcnow()

            session.commit()
            session.refresh(pomodoro_session)

            # Update daily stats
            PomodoroService._update_daily_stats(pomodoro_session.session_date)

            return pomodoro_session

    @staticmethod
    def get_daily_stats(stats_date: Optional[date] = None) -> DailyStatsResponse:
        """Get daily statistics for completed sessions"""
        if stats_date is None:
            stats_date = date.today()

        with Session(ENGINE) as session:
            # Get all sessions for the date
            sessions = session.exec(select(PomodoroSession).where(PomodoroSession.session_date == stats_date)).all()

            completed_work = sum(
                1 for s in sessions if s.session_type == SessionType.WORK and s.status == SessionStatus.COMPLETED
            )
            completed_short_breaks = sum(
                1 for s in sessions if s.session_type == SessionType.SHORT_BREAK and s.status == SessionStatus.COMPLETED
            )
            completed_long_breaks = sum(
                1 for s in sessions if s.session_type == SessionType.LONG_BREAK and s.status == SessionStatus.COMPLETED
            )

            total_work_minutes = sum(
                s.actual_duration_minutes or 0
                for s in sessions
                if s.session_type == SessionType.WORK and s.status == SessionStatus.COMPLETED
            )
            total_break_minutes = sum(
                s.actual_duration_minutes or 0
                for s in sessions
                if s.session_type in [SessionType.SHORT_BREAK, SessionType.LONG_BREAK]
                and s.status == SessionStatus.COMPLETED
            )

            paused_sessions = sum(1 for s in sessions if s.status == SessionStatus.PAUSED)
            cancelled_sessions = sum(1 for s in sessions if s.status == SessionStatus.CANCELLED)

            # Calculate productivity percentage
            total_sessions = len(sessions)
            completed_sessions = completed_work + completed_short_breaks + completed_long_breaks
            productivity_percentage = (completed_sessions / total_sessions * 100) if total_sessions > 0 else 0

            return DailyStatsResponse(
                stats_date=stats_date,
                completed_work_sessions=completed_work,
                completed_short_breaks=completed_short_breaks,
                completed_long_breaks=completed_long_breaks,
                total_work_minutes=total_work_minutes,
                total_break_minutes=total_break_minutes,
                paused_sessions=paused_sessions,
                cancelled_sessions=cancelled_sessions,
                productivity_percentage=productivity_percentage,
            )

    @staticmethod
    def get_next_session_type(work_sessions_in_cycle: int) -> SessionType:
        """Determine the next session type based on current cycle"""
        settings = PomodoroService.get_or_create_settings()

        if work_sessions_in_cycle >= settings.sessions_before_long_break:
            return SessionType.LONG_BREAK
        else:
            return SessionType.SHORT_BREAK

    @staticmethod
    def get_session_duration(session_type: SessionType) -> int:
        """Get the duration in minutes for a session type"""
        settings = PomodoroService.get_or_create_settings()

        match session_type:
            case SessionType.WORK:
                return settings.work_duration_minutes
            case SessionType.SHORT_BREAK:
                return settings.short_break_duration_minutes
            case SessionType.LONG_BREAK:
                return settings.long_break_duration_minutes
            case _:
                return settings.work_duration_minutes

    @staticmethod
    def _update_daily_stats(stats_date: date) -> None:
        """Update or create daily stats for a given date"""
        with Session(ENGINE) as session:
            # Get or create daily stats
            daily_stats = session.exec(select(DailyStats).where(DailyStats.stats_date == stats_date)).first()

            if daily_stats is None:
                daily_stats = DailyStats(stats_date=stats_date)
                session.add(daily_stats)

            # Recalculate all stats for the date
            sessions = session.exec(select(PomodoroSession).where(PomodoroSession.session_date == stats_date)).all()

            daily_stats.completed_work_sessions = sum(
                1 for s in sessions if s.session_type == SessionType.WORK and s.status == SessionStatus.COMPLETED
            )
            daily_stats.completed_short_breaks = sum(
                1 for s in sessions if s.session_type == SessionType.SHORT_BREAK and s.status == SessionStatus.COMPLETED
            )
            daily_stats.completed_long_breaks = sum(
                1 for s in sessions if s.session_type == SessionType.LONG_BREAK and s.status == SessionStatus.COMPLETED
            )

            daily_stats.total_work_minutes = sum(
                s.actual_duration_minutes or 0
                for s in sessions
                if s.session_type == SessionType.WORK and s.status == SessionStatus.COMPLETED
            )
            daily_stats.total_break_minutes = sum(
                s.actual_duration_minutes or 0
                for s in sessions
                if s.session_type in [SessionType.SHORT_BREAK, SessionType.LONG_BREAK]
                and s.status == SessionStatus.COMPLETED
            )

            daily_stats.paused_sessions = sum(1 for s in sessions if s.status == SessionStatus.PAUSED)
            daily_stats.cancelled_sessions = sum(1 for s in sessions if s.status == SessionStatus.CANCELLED)
            daily_stats.updated_at = datetime.utcnow()

            session.commit()

    @staticmethod
    def get_today_completed_work_sessions() -> int:
        """Get count of completed work sessions for today"""
        with Session(ENGINE) as session:
            count = session.exec(
                select(PomodoroSession).where(
                    PomodoroSession.session_date == date.today(),
                    PomodoroSession.session_type == SessionType.WORK,
                    PomodoroSession.status == SessionStatus.COMPLETED,
                )
            ).all()
            return len(count)
