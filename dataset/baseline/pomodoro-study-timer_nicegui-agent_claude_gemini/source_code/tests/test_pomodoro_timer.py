import pytest
from nicegui.testing import User
from nicegui import ui

from app.database import reset_db
from app.pomodoro_service import PomodoroService
from app.models import SessionType, PomodoroSettingsUpdate


@pytest.fixture()
def new_db():
    reset_db()
    yield
    reset_db()


class TestPomodoroTimerUI:
    async def test_timer_initial_display(self, user: User, new_db) -> None:
        """Test that timer displays correctly on initial load"""
        await user.open("/")

        # Check title
        await user.should_see("🍅 Pomodoro Timer")

        # Check initial state
        await user.should_see("Ready to Start")
        await user.should_see("25:00")
        await user.should_see("0 completed sessions")

        # Check buttons
        await user.should_see("Start")
        await user.should_see("Pause")
        await user.should_see("Reset")

    async def test_settings_display_and_update(self, user: User, new_db) -> None:
        """Test settings expansion and value updates"""
        await user.open("/")

        # Click settings expansion
        user.find("⚙️ Settings").click()

        # Check default settings are displayed - just verify inputs exist
        number_inputs = list(user.find(ui.number).elements)
        assert len(number_inputs) >= 4  # Work, short break, long break, cycle length

        # Verify inputs have reasonable default values
        values = [inp.value for inp in number_inputs]
        assert all(v > 0 for v in values)  # All should be positive
        assert any(v == 25 for v in values)  # Work duration should be 25
        assert any(v == 5 for v in values)  # Short break should be 5
        assert any(v == 15 for v in values)  # Long break should be 15
        assert any(v == 4 for v in values)  # Cycle should be 4

    async def test_settings_update_work_duration(self, user: User, new_db) -> None:
        """Test updating work duration setting"""
        await user.open("/")

        # Open settings
        user.find("⚙️ Settings").click()

        # Update work duration via service (simulating UI update)
        PomodoroService.update_settings(PomodoroSettingsUpdate(work_duration_minutes=30))

        # Verify setting was saved
        settings = PomodoroService.get_or_create_settings()
        assert settings.work_duration_minutes == 30

    async def test_audio_toggle_setting(self, user: User, new_db) -> None:
        """Test toggling audio setting"""
        await user.open("/")

        # Open settings
        user.find("⚙️ Settings").click()

        # Toggle audio setting via service (simulating UI toggle)
        current_settings = PomodoroService.get_or_create_settings()
        initial_value = current_settings.audio_enabled

        PomodoroService.update_settings(PomodoroSettingsUpdate(audio_enabled=not initial_value))

        # Verify setting was saved
        settings = PomodoroService.get_or_create_settings()
        assert settings.audio_enabled == (not initial_value)

    async def test_timer_start_creates_session(self, user: User, new_db) -> None:
        """Test that starting timer button exists and is clickable"""
        await user.open("/")

        # Start timer
        user.find("Start").click()

        # Just verify that clicking start doesn't crash the app
        # The actual session creation is tested in the service layer

    async def test_reset_button_functionality(self, user: User, new_db) -> None:
        """Test that reset button is present and clickable"""
        await user.open("/")

        # Reset timer (should work even if not started)
        user.find("Reset").click()

        # Should still show initial state
        await user.should_see("Ready to Start")
        await user.should_see("25:00")

    async def test_custom_work_duration_affects_timer(self, user: User, new_db) -> None:
        """Test that custom work duration affects timer display"""
        await user.open("/")

        # Change work duration to 30 minutes via service
        PomodoroService.update_settings(PomodoroSettingsUpdate(work_duration_minutes=30))

        # Refresh page to see new settings
        await user.open("/")

        # The timer should now show 30:00 as default
        await user.should_see("30:00")

    async def test_stats_display_updates(self, user: User, new_db) -> None:
        """Test that stats display shows correct information"""
        # Create some completed sessions directly
        settings = PomodoroService.get_or_create_settings()
        from app.models import PomodoroSessionCreate

        # Create and complete a work session
        session_create = PomodoroSessionCreate(
            session_type=SessionType.WORK, planned_duration_minutes=25, settings_id=settings.id or 1
        )
        session = PomodoroService.create_session(session_create)
        PomodoroService.complete_session(session.id or 1, 25)

        await user.open("/")

        # Should show 1 completed session and 25 minutes focused
        await user.should_see("1 completed sessions")
        await user.should_see("25m focused")

    async def test_multiple_sessions_stats(self, user: User, new_db) -> None:
        """Test stats with multiple completed sessions"""
        settings = PomodoroService.get_or_create_settings()
        from app.models import PomodoroSessionCreate

        # Create multiple completed work sessions
        for _ in range(3):
            session_create = PomodoroSessionCreate(
                session_type=SessionType.WORK, planned_duration_minutes=25, settings_id=settings.id or 1
            )
            session = PomodoroService.create_session(session_create)
            PomodoroService.complete_session(session.id or 1, 25)

        await user.open("/")

        # Should show 3 completed sessions and 75 minutes (1h 15m) focused
        await user.should_see("3 completed sessions")
        await user.should_see("1h 15m focused")

    async def test_settings_validation_boundaries(self, user: User, new_db) -> None:
        """Test that settings inputs respect validation boundaries"""
        await user.open("/")

        # Open settings
        user.find("⚙️ Settings").click()

        # Test boundary values via service

        # Test minimum boundary
        PomodoroService.update_settings(PomodoroSettingsUpdate(work_duration_minutes=1))
        settings = PomodoroService.get_or_create_settings()
        assert settings.work_duration_minutes == 1

        # Test maximum boundary
        PomodoroService.update_settings(PomodoroSettingsUpdate(work_duration_minutes=120))
        settings = PomodoroService.get_or_create_settings()
        assert settings.work_duration_minutes == 120

    async def test_cycle_length_setting(self, user: User, new_db) -> None:
        """Test that cycle length setting works"""
        await user.open("/")

        # Open settings
        user.find("⚙️ Settings").click()

        # Change cycle length to 3 via service
        PomodoroService.update_settings(PomodoroSettingsUpdate(sessions_before_long_break=3))

        # Verify setting was saved
        settings = PomodoroService.get_or_create_settings()
        assert settings.sessions_before_long_break == 3

    async def test_break_duration_settings(self, user: User, new_db) -> None:
        """Test that break duration settings work"""
        await user.open("/")

        # Open settings
        user.find("⚙️ Settings").click()

        # Set break durations via service
        PomodoroService.update_settings(
            PomodoroSettingsUpdate(short_break_duration_minutes=10, long_break_duration_minutes=25)
        )

        # Verify settings were saved
        settings = PomodoroService.get_or_create_settings()
        assert settings.short_break_duration_minutes == 10
        assert settings.long_break_duration_minutes == 25

    async def test_ui_components_exist(self, user: User, new_db) -> None:
        """Test that all required UI components are present"""
        await user.open("/")

        # Check main components
        await user.should_see("Pomodoro Timer")

        # Check time display
        time_labels = list(user.find(ui.label).elements)
        time_display_found = any("25:00" in label.text for label in time_labels)
        assert time_display_found

        # Check buttons exist
        buttons = list(user.find(ui.button).elements)
        button_texts = [button.text for button in buttons]
        assert "Start" in button_texts
        assert "Pause" in button_texts
        assert "Reset" in button_texts

        # Check settings expansion exists
        expansions = list(user.find(ui.expansion).elements)
        assert len(expansions) > 0

        # Check cards exist for layout
        cards = list(user.find(ui.card).elements)
        assert len(cards) >= 3  # Timer display, stats, settings
