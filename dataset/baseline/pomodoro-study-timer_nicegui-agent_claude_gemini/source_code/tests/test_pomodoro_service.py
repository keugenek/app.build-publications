import pytest
from datetime import date, timedelta

from app.database import reset_db
from app.pomodoro_service import PomodoroService
from app.models import SessionType, SessionStatus, PomodoroSettingsUpdate, PomodoroSessionCreate, PomodoroSessionUpdate


@pytest.fixture()
def new_db():
    reset_db()
    yield
    reset_db()


class TestPomodoroService:
    def test_get_or_create_settings_creates_default(self, new_db):
        """Test that default settings are created when none exist"""
        settings = PomodoroService.get_or_create_settings()

        assert settings is not None
        assert settings.work_duration_minutes == 25
        assert settings.short_break_duration_minutes == 5
        assert settings.long_break_duration_minutes == 15
        assert settings.sessions_before_long_break == 4
        assert settings.audio_enabled
        assert settings.id is not None

    def test_get_or_create_settings_returns_existing(self, new_db):
        """Test that existing settings are returned"""
        # Create settings first
        first_settings = PomodoroService.get_or_create_settings()
        first_id = first_settings.id

        # Get settings again
        second_settings = PomodoroService.get_or_create_settings()

        assert second_settings.id == first_id
        assert second_settings.work_duration_minutes == 25

    def test_update_settings_partial_update(self, new_db):
        """Test partial settings update"""
        # Create initial settings
        initial_settings = PomodoroService.get_or_create_settings()

        # Update only work duration
        update = PomodoroSettingsUpdate(work_duration_minutes=30)
        updated_settings = PomodoroService.update_settings(update)

        assert updated_settings.work_duration_minutes == 30
        assert updated_settings.short_break_duration_minutes == initial_settings.short_break_duration_minutes
        assert updated_settings.id == initial_settings.id

    def test_update_settings_creates_new_if_none_exist(self, new_db):
        """Test that settings are created if none exist during update"""
        update = PomodoroSettingsUpdate(work_duration_minutes=35, audio_enabled=False)
        settings = PomodoroService.update_settings(update)

        assert settings.work_duration_minutes == 35
        assert not settings.audio_enabled
        assert settings.short_break_duration_minutes == 5  # Default value

    def test_create_session(self, new_db):
        """Test creating a new Pomodoro session"""
        settings = PomodoroService.get_or_create_settings()

        session_create = PomodoroSessionCreate(
            session_type=SessionType.WORK,
            planned_duration_minutes=25,
            settings_id=settings.id or 1 or 1,
            notes="Test session",
        )

        session = PomodoroService.create_session(session_create)

        assert session is not None
        assert session.session_type == SessionType.WORK
        assert session.planned_duration_minutes == 25
        assert session.notes == "Test session"
        assert session.settings_id == settings.id
        assert session.session_date == date.today()
        assert session.id is not None

    def test_update_session(self, new_db):
        """Test updating an existing session"""
        settings = PomodoroService.get_or_create_settings()

        # Create session
        session_create = PomodoroSessionCreate(
            session_type=SessionType.WORK, planned_duration_minutes=25, settings_id=settings.id or 1 or 1
        )
        session = PomodoroService.create_session(session_create)

        # Update session
        update = PomodoroSessionUpdate(status=SessionStatus.PAUSED, actual_duration_minutes=15, notes="Paused session")
        updated_session = PomodoroService.update_session(session.id or 1, update)

        assert updated_session is not None
        assert updated_session.status == SessionStatus.PAUSED
        assert updated_session.actual_duration_minutes == 15
        assert updated_session.notes == "Paused session"

    def test_update_session_nonexistent(self, new_db):
        """Test updating a non-existent session returns None"""
        update = PomodoroSessionUpdate(status=SessionStatus.COMPLETED)
        result = PomodoroService.update_session(999, update)

        assert result is None

    def test_complete_session(self, new_db):
        """Test completing a session"""
        settings = PomodoroService.get_or_create_settings()

        # Create session
        session_create = PomodoroSessionCreate(
            session_type=SessionType.WORK, planned_duration_minutes=25, settings_id=settings.id or 1 or 1
        )
        session = PomodoroService.create_session(session_create)

        # Complete session
        completed_session = PomodoroService.complete_session(session.id or 1, 25)

        assert completed_session is not None
        assert completed_session.status == SessionStatus.COMPLETED
        assert completed_session.actual_duration_minutes == 25
        assert completed_session.ended_at is not None

    def test_complete_session_nonexistent(self, new_db):
        """Test completing a non-existent session returns None"""
        result = PomodoroService.complete_session(999, 25)
        assert result is None

    def test_get_daily_stats_empty(self, new_db):
        """Test getting daily stats when no sessions exist"""
        stats = PomodoroService.get_daily_stats()

        assert stats.stats_date == date.today()
        assert stats.completed_work_sessions == 0
        assert stats.completed_short_breaks == 0
        assert stats.completed_long_breaks == 0
        assert stats.total_work_minutes == 0
        assert stats.total_break_minutes == 0
        assert stats.paused_sessions == 0
        assert stats.cancelled_sessions == 0
        assert stats.productivity_percentage == 0.0

    def test_get_daily_stats_with_sessions(self, new_db):
        """Test getting daily stats with various session types"""
        settings = PomodoroService.get_or_create_settings()

        # Create completed work sessions
        for i in range(3):
            session_create = PomodoroSessionCreate(
                session_type=SessionType.WORK, planned_duration_minutes=25, settings_id=settings.id or 1
            )
            session = PomodoroService.create_session(session_create)
            PomodoroService.complete_session(session.id or 1, 25)

        # Create completed short break
        session_create = PomodoroSessionCreate(
            session_type=SessionType.SHORT_BREAK, planned_duration_minutes=5, settings_id=settings.id or 1
        )
        session = PomodoroService.create_session(session_create)
        PomodoroService.complete_session(session.id or 1, 5)

        # Create paused session
        session_create = PomodoroSessionCreate(
            session_type=SessionType.WORK, planned_duration_minutes=25, settings_id=settings.id or 1 or 1
        )
        session = PomodoroService.create_session(session_create)
        PomodoroService.update_session(session.id or 1, PomodoroSessionUpdate(status=SessionStatus.PAUSED))

        stats = PomodoroService.get_daily_stats()

        assert stats.completed_work_sessions == 3
        assert stats.completed_short_breaks == 1
        assert stats.total_work_minutes == 75  # 3 * 25
        assert stats.total_break_minutes == 5
        assert stats.paused_sessions == 1
        assert stats.productivity_percentage == 80.0  # 4 completed out of 5 total

    def test_get_daily_stats_specific_date(self, new_db):
        """Test getting daily stats for a specific date"""
        yesterday = date.today() - timedelta(days=1)
        stats = PomodoroService.get_daily_stats(yesterday)

        assert stats.stats_date == yesterday
        assert stats.completed_work_sessions == 0

    def test_get_next_session_type_short_break(self, new_db):
        """Test getting next session type for short break"""
        next_type = PomodoroService.get_next_session_type(1)  # 1 work session completed
        assert next_type == SessionType.SHORT_BREAK

    def test_get_next_session_type_long_break(self, new_db):
        """Test getting next session type for long break"""
        next_type = PomodoroService.get_next_session_type(4)  # 4 work sessions completed
        assert next_type == SessionType.LONG_BREAK

    def test_get_next_session_type_custom_cycle_length(self, new_db):
        """Test getting next session type with custom cycle length"""
        # Set custom cycle length
        PomodoroService.update_settings(PomodoroSettingsUpdate(sessions_before_long_break=3))

        # Should get short break after 1 or 2 sessions
        assert PomodoroService.get_next_session_type(1) == SessionType.SHORT_BREAK
        assert PomodoroService.get_next_session_type(2) == SessionType.SHORT_BREAK

        # Should get long break after 3 sessions
        assert PomodoroService.get_next_session_type(3) == SessionType.LONG_BREAK

    def test_get_session_duration_defaults(self, new_db):
        """Test getting session durations with default settings"""
        assert PomodoroService.get_session_duration(SessionType.WORK) == 25
        assert PomodoroService.get_session_duration(SessionType.SHORT_BREAK) == 5
        assert PomodoroService.get_session_duration(SessionType.LONG_BREAK) == 15

    def test_get_session_duration_custom_settings(self, new_db):
        """Test getting session durations with custom settings"""
        PomodoroService.update_settings(
            PomodoroSettingsUpdate(
                work_duration_minutes=30, short_break_duration_minutes=10, long_break_duration_minutes=20
            )
        )

        assert PomodoroService.get_session_duration(SessionType.WORK) == 30
        assert PomodoroService.get_session_duration(SessionType.SHORT_BREAK) == 10
        assert PomodoroService.get_session_duration(SessionType.LONG_BREAK) == 20

    def test_get_today_completed_work_sessions_empty(self, new_db):
        """Test getting today's completed work sessions when none exist"""
        count = PomodoroService.get_today_completed_work_sessions()
        assert count == 0

    def test_get_today_completed_work_sessions_with_data(self, new_db):
        """Test getting today's completed work sessions with data"""
        settings = PomodoroService.get_or_create_settings()

        # Create and complete work sessions
        for i in range(3):
            session_create = PomodoroSessionCreate(
                session_type=SessionType.WORK, planned_duration_minutes=25, settings_id=settings.id or 1
            )
            session = PomodoroService.create_session(session_create)
            PomodoroService.complete_session(session.id or 1, 25)

        # Create break session (should not count)
        session_create = PomodoroSessionCreate(
            session_type=SessionType.SHORT_BREAK, planned_duration_minutes=5, settings_id=settings.id or 1
        )
        session = PomodoroService.create_session(session_create)
        PomodoroService.complete_session(session.id or 1, 5)

        # Create incomplete work session (should not count)
        session_create = PomodoroSessionCreate(
            session_type=SessionType.WORK, planned_duration_minutes=25, settings_id=settings.id or 1 or 1
        )
        PomodoroService.create_session(session_create)

        count = PomodoroService.get_today_completed_work_sessions()
        assert count == 3

    def test_settings_validation_boundaries(self, new_db):
        """Test settings validation at boundaries"""
        # Test minimum values
        update = PomodoroSettingsUpdate(
            work_duration_minutes=1,
            short_break_duration_minutes=1,
            long_break_duration_minutes=1,
            sessions_before_long_break=1,
        )
        settings = PomodoroService.update_settings(update)

        assert settings.work_duration_minutes == 1
        assert settings.short_break_duration_minutes == 1
        assert settings.long_break_duration_minutes == 1
        assert settings.sessions_before_long_break == 1

        # Test maximum values
        update = PomodoroSettingsUpdate(
            work_duration_minutes=120,
            short_break_duration_minutes=60,
            long_break_duration_minutes=60,
            sessions_before_long_break=10,
        )
        settings = PomodoroService.update_settings(update)

        assert settings.work_duration_minutes == 120
        assert settings.short_break_duration_minutes == 60
        assert settings.long_break_duration_minutes == 60
        assert settings.sessions_before_long_break == 10
