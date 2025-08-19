from nicegui import ui
from datetime import date, timedelta
import logging
import asyncio

from app.habit_service import HabitService
from app.models import HabitCreate

logger = logging.getLogger(__name__)


def apply_modern_theme():
    """Apply modern color theme for the application"""
    ui.colors(
        primary="#2563eb",
        secondary="#64748b",
        accent="#10b981",
        positive="#10b981",
        negative="#ef4444",
        warning="#f59e0b",
        info="#3b82f6",
    )


class TextStyles:
    """Reusable text style classes"""

    HEADING = "text-3xl font-bold text-gray-800 mb-6"
    SUBHEADING = "text-xl font-semibold text-gray-700 mb-4"
    BODY = "text-base text-gray-600 leading-relaxed"
    CAPTION = "text-sm text-gray-500"
    CARD_TITLE = "text-lg font-semibold text-gray-800 mb-2"


@ui.refreshable
def habits_display():
    """Refreshable display of all habits"""
    try:
        service = HabitService()
        habits = service.get_all_habits()
        service.close()

        if not habits:
            with ui.card().classes("p-8 text-center bg-gray-50"):
                ui.label("No habits yet! Create your first habit above.").classes("text-lg text-gray-600")
                ui.label("Start building better habits today 🌟").classes("text-gray-500 mt-2")
            return

        # Display habits in cards
        for habit in habits:
            create_habit_card(habit)

    except Exception as e:
        logger.error(f"Error displaying habits: {e}")
        ui.notify("Error loading habits", type="negative")


def create_habit_card(habit):
    """Create a habit card"""
    service = HabitService()
    is_checked_today = service.is_checked_in_today(habit.id)
    service.close()

    def toggle_check_in():
        """Toggle habit check-in"""
        try:
            service = HabitService()
            if service.is_checked_in_today(habit.id):
                success = service.undo_check_in(habit.id)
                if success:
                    ui.notify(f'Unmarked "{habit.name}" for today', type="warning")
                else:
                    ui.notify("Failed to undo check-in", type="negative")
            else:
                check_in = service.check_in_habit(habit.id)
                if check_in:
                    ui.notify(f'Great job! Marked "{habit.name}" complete', type="positive")
                else:
                    ui.notify("Failed to check in habit", type="negative")
            service.close()
            habits_display.refresh()
        except Exception as e:
            logger.error(f"Error toggling check-in: {e}")
            ui.notify("An error occurred", type="negative")

    async def confirm_and_delete():
        """Delete habit with confirmation"""
        with ui.dialog() as dialog, ui.card():
            ui.label(f'Delete "{habit.name}"?').classes("text-lg mb-4")
            ui.label("This will permanently remove the habit and all check-ins.").classes("text-sm text-gray-600 mb-4")
            with ui.row().classes("gap-2 justify-end"):
                ui.button("Cancel", on_click=lambda: dialog.submit(False)).props("outline")
                ui.button("Delete", on_click=lambda: dialog.submit(True), color="negative")

        if await dialog:
            try:
                service = HabitService()
                success = service.delete_habit(habit.id)
                service.close()
                if success:
                    ui.notify(f'Deleted habit "{habit.name}"', type="warning")
                    habits_display.refresh()
                else:
                    ui.notify("Failed to delete habit", type="negative")
            except Exception as e:
                logger.error(f"Error deleting habit: {e}")
                ui.notify("Error occurred while deleting", type="negative")

    # Card styling
    card_classes = "p-6 bg-white shadow-lg rounded-xl mb-4"
    if is_checked_today:
        card_classes += " border-l-4 border-green-500 bg-green-50"

    with ui.card().classes(card_classes):
        with ui.row().classes("w-full items-center justify-between"):
            # Left side: Habit info
            with ui.column().classes("flex-1"):
                ui.label(habit.name).classes(TextStyles.CARD_TITLE)

                # Streak and stats
                if habit.current_streak > 0:
                    ui.label(f"🔥 {habit.current_streak} day streak").classes("text-orange-600 font-semibold")
                else:
                    ui.label("Start your streak!").classes("text-gray-500")

                ui.label(f"{habit.total_check_ins} total check-ins").classes(TextStyles.CAPTION)

                # Status
                if habit.last_check_in:
                    if habit.last_check_in == date.today():
                        ui.label("✅ Completed today").classes("text-green-600 font-medium")
                    else:
                        days_ago = (date.today() - habit.last_check_in).days
                        ui.label(f"Last completed {days_ago} day{'s' if days_ago != 1 else ''} ago").classes(
                            "text-gray-500"
                        )

            # Right side: Actions
            with ui.column().classes("gap-2"):
                check_in_text = "Undo" if is_checked_today else "Check In"
                check_in_color = "negative" if is_checked_today else "positive"
                ui.button(check_in_text, on_click=toggle_check_in, color=check_in_color).classes("px-4 py-2")
                ui.button("Delete", on_click=lambda: asyncio.create_task(confirm_and_delete())).props(
                    "outline color=negative size=sm"
                )


@ui.refreshable
def stats_display():
    """Refreshable stats display"""
    try:
        service = HabitService()
        habits = service.get_all_habits()

        total_habits = len(habits)
        completed_today = sum(1 for h in habits if service.is_checked_in_today(h.id))
        total_streak_days = sum(h.current_streak for h in habits)

        service.close()

        with ui.row().classes("gap-4 w-full mb-8"):
            # Stats cards
            with ui.card().classes("p-4 bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg flex-1"):
                ui.label(str(total_habits)).classes("text-3xl font-bold")
                ui.label("Total Habits").classes("text-blue-100")

            with ui.card().classes("p-4 bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg flex-1"):
                ui.label(str(completed_today)).classes("text-3xl font-bold")
                ui.label("Completed Today").classes("text-green-100")

            with ui.card().classes("p-4 bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg flex-1"):
                ui.label(str(total_streak_days)).classes("text-3xl font-bold")
                ui.label("Total Streak Days").classes("text-orange-100")

    except Exception as e:
        logger.error(f"Error loading stats: {e}")


def create():
    """Create the habit tracker application"""
    apply_modern_theme()

    @ui.page("/")
    def home_page():
        async def create_new_habit():
            """Create new habit dialog"""
            with ui.dialog() as dialog, ui.card():
                ui.label("Create New Habit").classes("text-xl font-bold mb-4")

                habit_name_input = ui.input(
                    label="Habit Name",
                    placeholder="e.g., Exercise for 30 minutes",
                    validation={"Too short": lambda value: len(value.strip()) >= 1},
                ).classes("w-80 mb-4")

                ui.label('Examples: "Drink 8 glasses of water", "Read for 20 minutes"').classes(
                    "text-sm text-gray-500 mb-4"
                )

                with ui.row().classes("gap-2 justify-end"):
                    ui.button("Cancel", on_click=lambda: dialog.submit(False)).props("outline")
                    ui.button("Create", on_click=lambda: dialog.submit(True), color="primary")

            if await dialog and habit_name_input.value.strip():
                try:
                    service = HabitService()
                    habit_data = HabitCreate(name=habit_name_input.value.strip())
                    habit = service.create_habit(habit_data)
                    service.close()

                    if habit:
                        ui.notify(f'Created habit "{habit.name}"!', type="positive")
                        habits_display.refresh()
                        stats_display.refresh()
                    else:
                        ui.notify("Failed to create habit", type="negative")
                except Exception as e:
                    logger.error(f"Error creating habit: {e}")
                    ui.notify("Error creating habit", type="negative")

        # Header
        with ui.row().classes(
            "w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white p-8 rounded-lg mb-8 shadow-lg"
        ):
            with ui.column().classes("flex-1"):
                ui.label("Habit Tracker").classes("text-4xl font-bold mb-2")
                ui.label("Build better habits, one day at a time").classes("text-xl opacity-90")

            with ui.column().classes("justify-center"):
                ui.button(
                    "+ New Habit", on_click=lambda: asyncio.create_task(create_new_habit()), color="white"
                ).classes("text-blue-600 font-semibold px-6 py-3 text-lg")

        # Stats section
        stats_display()

        # Habits section
        ui.label("Your Habits").classes(TextStyles.SUBHEADING)
        habits_display()

    @ui.page("/habit/{habit_id}")
    def habit_detail_page(habit_id: int):
        """Detailed view for a specific habit"""
        try:
            service = HabitService()
            habit_data = service.get_habit(habit_id)

            if not habit_data:
                ui.label("Habit not found").classes("text-xl text-red-600")
                ui.link("← Back to Home", "/").classes("text-blue-600 hover:underline mt-4")
                service.close()
                return

            # Get habit with streak info
            habits = service.get_all_habits(include_inactive=True)
            habit = next((h for h in habits if h.id == habit_id), None)

            if not habit:
                ui.label("Habit not found").classes("text-xl text-red-600")
                ui.link("← Back to Home", "/").classes("text-blue-600 hover:underline mt-4")
                service.close()
                return

            # Header
            with ui.row().classes("w-full items-center justify-between mb-8"):
                ui.label(f"Habit: {habit.name}").classes(TextStyles.HEADING)
                ui.link("← Back to Home", "/").classes("text-blue-600 hover:underline font-medium")

            # Habit stats
            with ui.row().classes("gap-4 w-full mb-8"):
                with ui.card().classes("p-6 bg-white shadow-lg rounded-xl flex-1"):
                    ui.label("Current Streak").classes(TextStyles.CAPTION)
                    ui.label(f"{habit.current_streak} days").classes("text-3xl font-bold text-orange-600 mt-2")

                with ui.card().classes("p-6 bg-white shadow-lg rounded-xl flex-1"):
                    ui.label("Total Check-ins").classes(TextStyles.CAPTION)
                    ui.label(str(habit.total_check_ins)).classes("text-3xl font-bold text-blue-600 mt-2")

                with ui.card().classes("p-6 bg-white shadow-lg rounded-xl flex-1"):
                    ui.label("Status").classes(TextStyles.CAPTION)
                    status_text = "Active" if habit.is_active else "Inactive"
                    status_color = "text-green-600" if habit.is_active else "text-gray-600"
                    ui.label(status_text).classes(f"text-2xl font-bold {status_color} mt-2")

            # Recent activity
            history = service.get_habit_history(habit_id, days=30)

            ui.label("Recent Activity (Last 30 Days)").classes(TextStyles.SUBHEADING)

            if history:
                with ui.card().classes("p-6 bg-white shadow-lg rounded-xl"):
                    # Calendar view
                    with ui.row().classes("gap-2 flex-wrap"):
                        for days_ago in range(29, -1, -1):
                            check_date = date.today() - timedelta(days=days_ago)
                            is_completed = check_date in history

                            color = "bg-green-500" if is_completed else "bg-gray-200"
                            tooltip = (
                                f"{check_date.strftime('%b %d')}: {'✓ Completed' if is_completed else 'Not completed'}"
                            )

                            ui.button("").classes(f"w-4 h-4 rounded {color}").props("flat").tooltip(tooltip)

                    # Summary
                    completion_rate = len(history) / 30 * 100
                    ui.label(f"Completion rate: {completion_rate:.1f}% ({len(history)}/30 days)").classes(
                        "text-gray-600 mt-4"
                    )
            else:
                with ui.card().classes("p-6 bg-gray-50"):
                    ui.label("No activity in the last 30 days").classes("text-gray-600")
                    ui.label("Start building your streak today!").classes("text-gray-500 mt-2")

            service.close()

        except Exception as e:
            logger.error(f"Error loading habit detail: {e}")
            ui.label("Error loading habit details").classes("text-red-600")
            ui.link("← Back to Home", "/").classes("text-blue-600 hover:underline mt-4")
