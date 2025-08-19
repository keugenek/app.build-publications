from nicegui import ui
from typing import Optional
import asyncio

from app.pomodoro_service import PomodoroService
from app.models import (
    SessionType,
    SessionStatus,
    PomodoroSessionCreate,
    PomodoroSessionUpdate,
    TimerState,
    PomodoroSettingsUpdate,
)


class PomodoroTimer:
    """Minimalistic Pomodoro Timer UI Component"""

    def __init__(self):
        self.timer_state = TimerState()
        self.current_session_id: Optional[int] = None
        self.timer_task: Optional[asyncio.Task] = None
        self.work_sessions_in_cycle = 0

        # UI components (will be set in create_ui)
        self.time_display = None
        self.session_type_label = None
        self.start_button = None
        self.pause_button = None
        self.reset_button = None
        self.settings_card = None
        self.stats_display = None

    async def create_ui(self):
        """Create the minimalistic Pomodoro timer UI"""
        # Apply modern theme
        ui.colors(
            primary="#2563eb",
            secondary="#64748b",
            accent="#10b981",
            positive="#10b981",
            negative="#ef4444",
            warning="#f59e0b",
        )

        # Main container with centered layout
        with ui.column().classes("items-center justify-center min-h-screen bg-gray-50 p-8"):
            # Title
            ui.label("🍅 Pomodoro Timer").classes("text-4xl font-bold text-gray-800 mb-8")

            # Timer display card
            with ui.card().classes("w-96 p-8 text-center shadow-xl rounded-3xl bg-white"):
                # Session type indicator
                self.session_type_label = ui.label("Ready to Start").classes("text-lg font-medium text-gray-600 mb-4")

                # Large time display
                self.time_display = ui.label("25:00").classes("text-6xl font-mono font-bold text-primary mb-6")

                # Control buttons
                with ui.row().classes("gap-4 justify-center"):
                    self.start_button = ui.button("Start", on_click=self.start_timer).classes(
                        "bg-positive text-white px-6 py-3 rounded-lg font-medium hover:shadow-md"
                    )
                    self.pause_button = (
                        ui.button("Pause", on_click=self.pause_timer)
                        .classes("bg-warning text-white px-6 py-3 rounded-lg font-medium hover:shadow-md")
                        .props("disable")
                    )
                    self.reset_button = ui.button("Reset", on_click=self.reset_timer).classes(
                        "bg-negative text-white px-6 py-3 rounded-lg font-medium hover:shadow-md"
                    )

            # Stats display
            with ui.card().classes("w-96 p-6 mt-6 shadow-lg rounded-xl bg-white"):
                ui.label("Today's Progress").classes("text-lg font-semibold text-gray-800 mb-4")
                self.stats_display = ui.label("0 completed sessions").classes("text-gray-600")

            # Settings toggle
            with ui.card().classes("w-96 p-4 mt-6 shadow-lg rounded-xl bg-white"):
                with ui.expansion("⚙️ Settings", icon="settings").classes("w-full"):
                    self._create_settings_ui()

        # Initialize display
        await self._update_display()
        await self._update_stats()

    def _create_settings_ui(self):
        """Create the settings configuration UI"""
        settings = PomodoroService.get_or_create_settings()

        ui.label("Timer Durations").classes("text-sm font-medium text-gray-700 mb-2")

        # Work duration setting
        with ui.row().classes("items-center gap-4 mb-4"):
            ui.label("Work:").classes("w-20 text-sm")
            work_input = ui.number(value=settings.work_duration_minutes, min=1, max=120, suffix="min").classes("w-24")
            work_input.on("blur", lambda: self._update_setting("work_duration_minutes", work_input.value))

        # Short break duration setting
        with ui.row().classes("items-center gap-4 mb-4"):
            ui.label("Short Break:").classes("w-20 text-sm")
            short_break_input = ui.number(
                value=settings.short_break_duration_minutes, min=1, max=60, suffix="min"
            ).classes("w-24")
            short_break_input.on(
                "blur", lambda: self._update_setting("short_break_duration_minutes", short_break_input.value)
            )

        # Long break duration setting
        with ui.row().classes("items-center gap-4 mb-4"):
            ui.label("Long Break:").classes("w-20 text-sm")
            long_break_input = ui.number(
                value=settings.long_break_duration_minutes, min=1, max=60, suffix="min"
            ).classes("w-24")
            long_break_input.on(
                "blur", lambda: self._update_setting("long_break_duration_minutes", long_break_input.value)
            )

        # Sessions before long break
        with ui.row().classes("items-center gap-4 mb-4"):
            ui.label("Cycle Length:").classes("w-20 text-sm")
            cycle_input = ui.number(
                value=settings.sessions_before_long_break, min=1, max=10, suffix="sessions"
            ).classes("w-24")
            cycle_input.on("blur", lambda: self._update_setting("sessions_before_long_break", cycle_input.value))

        # Audio toggle
        audio_switch = ui.switch("Audio alerts", value=settings.audio_enabled).classes("mt-2")
        audio_switch.on("update:model-value", lambda e: self._update_setting("audio_enabled", e.args))

    def _update_setting(self, field: str, value):
        """Update a specific setting"""
        import logging

        logger = logging.getLogger(__name__)

        try:
            update_data = {field: value}
            PomodoroService.update_settings(PomodoroSettingsUpdate(**update_data))
            ui.notify("Settings updated", type="positive")
        except Exception as e:
            logger.exception(f"Error updating setting {field}: {value}")
            ui.notify(f"Error updating settings: {str(e)}", type="negative")

    async def start_timer(self):
        """Start or resume the Pomodoro timer"""
        if self.timer_state.is_paused:
            # Resume paused timer
            self.timer_state.is_paused = False
            self.timer_state.is_running = True
        else:
            # Start new session
            await self._start_new_session()

        # Start the countdown
        self.timer_task = asyncio.create_task(self._run_timer())
        await self._update_button_states()

    async def pause_timer(self):
        """Pause the current timer"""
        if self.timer_task:
            self.timer_task.cancel()
            self.timer_task = None

        self.timer_state.is_running = False
        self.timer_state.is_paused = True

        # Update current session as paused
        if self.current_session_id:
            actual_minutes = (self.timer_state.total_seconds - self.timer_state.remaining_seconds) // 60
            PomodoroService.update_session(
                self.current_session_id,
                PomodoroSessionUpdate(status=SessionStatus.PAUSED, actual_duration_minutes=actual_minutes),
            )

        await self._update_button_states()

    async def reset_timer(self):
        """Reset the timer to initial state"""
        if self.timer_task:
            self.timer_task.cancel()
            self.timer_task = None

        # Cancel current session if active
        if self.current_session_id:
            PomodoroService.update_session(
                self.current_session_id, PomodoroSessionUpdate(status=SessionStatus.CANCELLED)
            )

        self.timer_state = TimerState()
        self.current_session_id = None

        await self._update_display()
        await self._update_button_states()
        await self._update_stats()

    async def _start_new_session(self):
        """Start a new Pomodoro session"""
        # Determine session type
        if self.timer_state.current_session_type is None:
            session_type = SessionType.WORK
        else:
            # Alternate between work and break sessions
            if self.timer_state.current_session_type == SessionType.WORK:
                session_type = PomodoroService.get_next_session_type(self.work_sessions_in_cycle)
                if session_type == SessionType.LONG_BREAK:
                    self.work_sessions_in_cycle = 0  # Reset cycle
            else:
                session_type = SessionType.WORK

        # Get duration for session type
        duration_minutes = PomodoroService.get_session_duration(session_type)

        # Create session in database
        settings = PomodoroService.get_or_create_settings()
        if settings.id is None:
            import logging

            logger = logging.getLogger(__name__)
            logger.error("Settings ID is None when creating session")
            return

        session_create = PomodoroSessionCreate(
            session_type=session_type, planned_duration_minutes=duration_minutes, settings_id=settings.id
        )
        session = PomodoroService.create_session(session_create)

        # Update timer state
        self.current_session_id = session.id
        self.timer_state.current_session_type = session_type
        self.timer_state.total_seconds = duration_minutes * 60
        self.timer_state.remaining_seconds = self.timer_state.total_seconds
        self.timer_state.is_running = True
        self.timer_state.is_paused = False

        if session_type == SessionType.WORK:
            self.work_sessions_in_cycle += 1

    async def _run_timer(self):
        """Run the countdown timer"""
        try:
            while self.timer_state.remaining_seconds > 0 and self.timer_state.is_running:
                await asyncio.sleep(1)
                if not self.timer_state.is_paused:
                    self.timer_state.remaining_seconds -= 1
                    await self._update_display()

            # Timer completed
            if self.timer_state.remaining_seconds <= 0:
                await self._complete_session()
        except asyncio.CancelledError:
            import logging

            logger = logging.getLogger(__name__)
            logger.info("Timer was cancelled")
            # Timer was cancelled
            pass

    async def _complete_session(self):
        """Handle session completion"""
        if not self.current_session_id:
            return

        # Complete the session
        actual_minutes = self.timer_state.total_seconds // 60
        PomodoroService.complete_session(self.current_session_id, actual_minutes)

        # Play audio alert
        await self._play_audio_alert()

        # Show completion notification
        session_type_text = self._get_session_type_text(self.timer_state.current_session_type)
        ui.notify(f"{session_type_text} completed!", type="positive")

        # Reset timer state
        self.timer_state = TimerState()
        self.current_session_id = None

        await self._update_display()
        await self._update_button_states()
        await self._update_stats()

    async def _play_audio_alert(self):
        """Play audio alert for session completion"""
        settings = PomodoroService.get_or_create_settings()
        if settings.audio_enabled:
            # Create a simple beeping sound using Web Audio API
            ui.run_javascript("""
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.frequency.value = 800; // 800Hz beep
                oscillator.type = 'sine';
                
                gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
                
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.3);
                
                // Repeat beep 3 times
                setTimeout(() => {
                    const osc2 = audioContext.createOscillator();
                    const gain2 = audioContext.createGain();
                    osc2.connect(gain2);
                    gain2.connect(audioContext.destination);
                    osc2.frequency.value = 800;
                    osc2.type = 'sine';
                    gain2.gain.setValueAtTime(0.3, audioContext.currentTime);
                    gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
                    osc2.start(); osc2.stop(audioContext.currentTime + 0.3);
                }, 400);
                
                setTimeout(() => {
                    const osc3 = audioContext.createOscillator();
                    const gain3 = audioContext.createGain();
                    osc3.connect(gain3);
                    gain3.connect(audioContext.destination);
                    osc3.frequency.value = 800;
                    osc3.type = 'sine';
                    gain3.gain.setValueAtTime(0.3, audioContext.currentTime);
                    gain3.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
                    osc3.start(); osc3.stop(audioContext.currentTime + 0.3);
                }, 800);
            """)

    async def _update_display(self):
        """Update the timer display"""
        if self.timer_state.current_session_type:
            session_text = self._get_session_type_text(self.timer_state.current_session_type)
            if self.timer_state.is_paused:
                session_text += " (Paused)"
            elif self.timer_state.is_running:
                session_text += " (Running)"
        else:
            session_text = "Ready to Start"

        if self.session_type_label:
            self.session_type_label.set_text(session_text)

        if self.timer_state.remaining_seconds > 0:
            minutes = self.timer_state.remaining_seconds // 60
            seconds = self.timer_state.remaining_seconds % 60
            time_text = f"{minutes:02d}:{seconds:02d}"
        else:
            # Show default time based on work session duration
            default_minutes = PomodoroService.get_session_duration(SessionType.WORK)
            time_text = f"{default_minutes:02d}:00"

        if self.time_display:
            self.time_display.set_text(time_text)

    async def _update_button_states(self):
        """Update button enabled/disabled states"""
        if not all([self.start_button, self.pause_button, self.reset_button]):
            return

        if self.timer_state.is_running:
            if self.start_button:
                self.start_button.props("disable")
            if self.pause_button:
                self.pause_button.props("")  # Enable
            if self.reset_button:
                self.reset_button.props("")  # Enable
        elif self.timer_state.is_paused:
            if self.start_button:
                self.start_button.props("")  # Enable (to resume)
            if self.pause_button:
                self.pause_button.props("disable")
            if self.reset_button:
                self.reset_button.props("")  # Enable
        else:
            if self.start_button:
                self.start_button.props("")  # Enable
            if self.pause_button:
                self.pause_button.props("disable")
            if self.reset_button:
                self.reset_button.props("")  # Enable

    async def _update_stats(self):
        """Update the statistics display"""
        stats = PomodoroService.get_daily_stats()
        stats_text = f"{stats.completed_work_sessions} completed sessions"

        if stats.total_work_minutes > 0:
            hours = stats.total_work_minutes // 60
            minutes = stats.total_work_minutes % 60
            if hours > 0:
                stats_text += f" • {hours}h {minutes}m focused"
            else:
                stats_text += f" • {minutes}m focused"

        if self.stats_display:
            self.stats_display.set_text(stats_text)

    def _get_session_type_text(self, session_type: Optional[SessionType]) -> str:
        """Get user-friendly text for session type"""
        match session_type:
            case SessionType.WORK:
                return "Work Session"
            case SessionType.SHORT_BREAK:
                return "Short Break"
            case SessionType.LONG_BREAK:
                return "Long Break"
            case _:
                return "Session"


def create():
    """Create the Pomodoro timer page"""

    @ui.page("/")
    async def pomodoro_page():
        timer = PomodoroTimer()
        await timer.create_ui()
