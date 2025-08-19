from nicegui import ui
from datetime import date
from decimal import Decimal
from typing import Optional
import logging

from app.wellness_service import WellnessService, UserService
from app.models import WellnessEntryCreate


logger = logging.getLogger(__name__)


# Application state
current_user_id: Optional[int] = None


def apply_modern_theme():
    """Apply modern color theme to the application"""
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
    """Reusable text styling classes"""

    HEADING = "text-2xl font-bold text-gray-800 mb-4"
    SUBHEADING = "text-lg font-semibold text-gray-700 mb-2"
    BODY = "text-base text-gray-600 leading-relaxed"
    CAPTION = "text-sm text-gray-500"
    METRIC_TITLE = "text-sm text-gray-500 uppercase tracking-wider"
    METRIC_VALUE = "text-3xl font-bold text-gray-800 mt-2"


def create_metric_card(title: str, value: str, subtitle: str = "", icon: str = "") -> None:
    """Create a modern metric card component"""
    with ui.card().classes("p-6 bg-white shadow-lg rounded-xl hover:shadow-xl transition-shadow min-w-48"):
        if icon:
            ui.icon(icon).classes("text-4xl text-primary mb-2")
        ui.label(title).classes(TextStyles.METRIC_TITLE)
        ui.label(value).classes(TextStyles.METRIC_VALUE)
        if subtitle:
            ui.label(subtitle).classes("text-sm text-gray-500 mt-1")


def create_wellness_entry_form():
    """Create the wellness entry form"""
    with ui.card().classes("w-full max-w-2xl p-6 shadow-lg rounded-lg"):
        ui.label("Daily Wellness Entry").classes(TextStyles.HEADING)
        ui.label("Track your daily wellness metrics to monitor your health").classes(TextStyles.BODY + " mb-6")

        # Form inputs
        with ui.row().classes("w-full gap-4"):
            with ui.column().classes("flex-1"):
                ui.label("Sleep Hours").classes("text-sm font-medium text-gray-700 mb-1")
                sleep_input = ui.number(placeholder="8.0", min=0, max=24, step=0.1, precision=1).classes("w-full")
                ui.label("Hours of sleep (0-24)").classes(TextStyles.CAPTION)

            with ui.column().classes("flex-1"):
                ui.label("Stress Level").classes("text-sm font-medium text-gray-700 mb-1")
                stress_input = ui.number(placeholder="5", min=1, max=10, step=1).classes("w-full")
                ui.label("Scale from 1 (low) to 10 (high)").classes(TextStyles.CAPTION)

        with ui.row().classes("w-full gap-4 mt-4"):
            with ui.column().classes("flex-1"):
                ui.label("Caffeine Intake").classes("text-sm font-medium text-gray-700 mb-1")
                caffeine_input = ui.number(placeholder="2.0", min=0, step=0.1, precision=1).classes("w-full")
                ui.label("Number of cups/servings").classes(TextStyles.CAPTION)

            with ui.column().classes("flex-1"):
                ui.label("Alcohol Intake").classes("text-sm font-medium text-gray-700 mb-1")
                alcohol_input = ui.number(placeholder="0.0", min=0, step=0.1, precision=1).classes("w-full")
                ui.label("Number of drinks").classes(TextStyles.CAPTION)

        # Entry date
        with ui.row().classes("w-full gap-4 mt-4"):
            ui.label("Entry Date").classes("text-sm font-medium text-gray-700 mb-1")
            date_input = ui.date(value=date.today().isoformat()).classes("w-full")

        # Submit button
        with ui.row().classes("gap-2 justify-end mt-6"):
            submit_btn = ui.button("Save Entry").classes("bg-primary text-white px-6 py-3 rounded-lg")
            ui.button("Clear Form", on_click=lambda: clear_form()).classes("px-6 py-3 rounded-lg").props("outline")

        def clear_form():
            sleep_input.value = None
            stress_input.value = None
            caffeine_input.value = None
            alcohol_input.value = None
            date_input.value = date.today().isoformat()

        def save_entry():
            global current_user_id
            if current_user_id is None:
                ui.notify("Please select a user first", type="warning")
                return

            # Validate inputs
            if not all(
                [
                    sleep_input.value is not None,
                    stress_input.value is not None,
                    caffeine_input.value is not None,
                    alcohol_input.value is not None,
                ]
            ):
                ui.notify("Please fill in all fields", type="warning")
                return

            try:
                # Handle date input value (could be string or date object)
                entry_date = date_input.value
                if isinstance(entry_date, str):
                    entry_date = date.fromisoformat(entry_date)

                entry_data = WellnessEntryCreate(
                    user_id=current_user_id,
                    entry_date=entry_date,
                    sleep_hours=Decimal(str(sleep_input.value)),
                    stress_level=int(stress_input.value),
                    caffeine_intake=Decimal(str(caffeine_input.value)),
                    alcohol_intake=Decimal(str(alcohol_input.value)),
                )

                entry = WellnessService.create_entry(entry_data)

                if entry is not None:
                    ui.notify(f"Entry saved! Wellness score: {entry.wellness_score}", type="positive")
                    clear_form()
                    refresh_dashboard()
                else:
                    ui.notify("Entry for this date already exists", type="warning")

            except Exception as e:
                logger.error(f"Error saving entry: {e}")
                ui.notify("Error saving entry. Please check your inputs.", type="negative")

        submit_btn.on_click(save_entry)


@ui.refreshable
def wellness_dashboard():
    """Refreshable wellness dashboard showing metrics and trends"""
    global current_user_id

    if current_user_id is None:
        ui.label("Please select a user to view dashboard").classes("text-center text-gray-500 p-8")
        return

    # Get recent entries and insights
    recent_entries = WellnessService.get_user_entries(current_user_id, limit=7)
    insights = WellnessService.get_wellness_insights(current_user_id)

    if not recent_entries:
        with ui.card().classes("p-8 text-center"):
            ui.icon("trending_up").classes("text-6xl text-gray-300 mb-4")
            ui.label("No wellness data yet").classes(TextStyles.SUBHEADING)
            ui.label("Start tracking your daily wellness to see insights here").classes(TextStyles.BODY)
        return

    # Metrics cards
    with ui.row().classes("gap-6 w-full mb-8"):
        # Current wellness score (most recent entry)
        latest_entry = recent_entries[0]

        create_metric_card(
            "Latest Score", f"{latest_entry.wellness_score}", f"Recorded {latest_entry.entry_date}", "stars"
        )

        # Average score
        if insights["average_score"] is not None:
            create_metric_card("7-Day Average", f"{insights['average_score']}", "Average wellness score", "trending_up")

        # Sleep average
        if insights["average_sleep"] is not None:
            create_metric_card("Avg Sleep", f"{insights['average_sleep']}h", "7-day average", "bedtime")

        # Entries tracked
        create_metric_card("Entries", f"{len(recent_entries)}", "Past 7 days", "calendar_today")

    # Insights and recommendations
    with ui.card().classes("w-full p-6 mb-8"):
        ui.label("Wellness Insights").classes(TextStyles.SUBHEADING)

        for recommendation in insights["recommendations"]:
            with ui.row().classes("items-center gap-2 mb-2"):
                ui.icon("lightbulb").classes("text-yellow-500")
                ui.label(recommendation).classes(TextStyles.BODY)

    # Recent entries table
    with ui.card().classes("w-full p-6"):
        ui.label("Recent Entries").classes(TextStyles.SUBHEADING + " mb-4")

        # Create table data
        table_data = []
        for entry in recent_entries:
            table_data.append(
                {
                    "date": str(entry.entry_date),
                    "score": float(entry.wellness_score),
                    "sleep": float(entry.sleep_hours),
                    "stress": entry.stress_level,
                    "caffeine": float(entry.caffeine_intake),
                    "alcohol": float(entry.alcohol_intake),
                    "id": entry.id,
                }
            )

        columns = [
            {"name": "date", "label": "Date", "field": "date", "align": "left"},
            {"name": "score", "label": "Score", "field": "score", "align": "center"},
            {"name": "sleep", "label": "Sleep (h)", "field": "sleep", "align": "center"},
            {"name": "stress", "label": "Stress", "field": "stress", "align": "center"},
            {"name": "caffeine", "label": "Caffeine", "field": "caffeine", "align": "center"},
            {"name": "alcohol", "label": "Alcohol", "field": "alcohol", "align": "center"},
            {"name": "actions", "label": "Actions", "field": "id", "align": "center"},
        ]

        table = ui.table(columns=columns, rows=table_data).classes("w-full")

        # Add delete button for each row
        with table.add_slot("body-cell-actions"):
            ui.button(icon="delete").classes("text-red-500").props("flat dense")


def delete_entry_handler(entry_id: int):
    """Handle entry deletion"""
    if WellnessService.delete_entry(entry_id):
        ui.notify("Entry deleted successfully", type="positive")
        refresh_dashboard()
    else:
        ui.notify("Error deleting entry", type="negative")


def refresh_dashboard():
    """Refresh the dashboard display"""
    wellness_dashboard.refresh()


def create_user_selector():
    """Create user selection interface"""
    global current_user_id

    with ui.card().classes("w-full p-4 mb-6"):
        with ui.row().classes("items-center gap-4"):
            ui.label("User:").classes("font-semibold")

            # Get all users
            users = UserService.get_all_users()
            user_options = {user.id: f"{user.name} ({user.email})" for user in users}

            if not users:
                ui.label("No users found. Create a user first.").classes("text-gray-500")
                return

            user_select = ui.select(
                options=user_options,
                value=current_user_id,
                on_change=lambda e: set_current_user(e.value) if e.value else None,
            ).classes("min-w-64")

            # Auto-select first user if none selected
            if current_user_id is None and users:
                current_user_id = users[0].id
                user_select.value = current_user_id
                refresh_dashboard()


def set_current_user(user_id: int):
    """Set the current user and refresh dashboard"""
    global current_user_id
    current_user_id = user_id
    refresh_dashboard()


async def create_user_dialog():
    """Create dialog for adding new users"""
    with ui.dialog() as dialog, ui.card().classes("w-96 p-6"):
        ui.label("Create New User").classes(TextStyles.HEADING)

        name_input = ui.input("Full Name").classes("w-full mb-4")
        email_input = ui.input("Email").classes("w-full mb-4")

        with ui.row().classes("gap-2 justify-end"):
            ui.button("Cancel", on_click=lambda: dialog.submit("cancel")).props("outline")
            ui.button("Create", on_click=lambda: dialog.submit("create")).classes("bg-primary text-white")

    result = await dialog

    if result == "create":
        if not name_input.value or not email_input.value:
            ui.notify("Please fill in all fields", type="warning")
            return

        user = UserService.create_user(name_input.value, email_input.value)
        if user is not None:
            ui.notify(f"User {user.name} created successfully!", type="positive")
            ui.navigate.reload()  # Reload page to update user selector
        else:
            ui.notify("Email already exists", type="warning")


def create():
    """Main function to create the wellness tracking application"""
    apply_modern_theme()

    @ui.page("/wellness")
    async def wellness_page():
        # Header
        with ui.row().classes("w-full items-center justify-between mb-6"):
            ui.label("🌟 Daily Wellness Tracker").classes("text-3xl font-bold text-primary")
            ui.button("Add User", on_click=create_user_dialog).classes("bg-secondary text-white px-4 py-2")

        # User selector
        create_user_selector()

        # Main content layout
        with ui.row().classes("w-full gap-8"):
            # Left column - Entry form
            with ui.column().classes("flex-1 max-w-2xl"):
                create_wellness_entry_form()

            # Right column - Dashboard
            with ui.column().classes("flex-1"):
                wellness_dashboard()

        # Page styling
        ui.add_head_html("""<style>
            .nicegui-content {
                padding: 2rem;
                background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
                min-height: 100vh;
            }
        </style>""")

    @ui.page("/trends")
    async def trends_page():
        """Dedicated trends page for detailed historical analysis"""
        global current_user_id

        # Header
        ui.label("📊 Wellness Trends").classes("text-3xl font-bold text-primary mb-6")

        # User selector
        create_user_selector()

        if current_user_id is None:
            return

        # Trend analysis
        with ui.row().classes("w-full gap-6 mb-8"):
            # 30-day trends
            trends_30 = WellnessService.get_wellness_trends(current_user_id, days=30)

            if trends_30:
                # Score trend chart data

                scores = [float(trend.wellness_score) for trend in trends_30]

                with ui.card().classes("flex-1 p-6"):
                    ui.label("30-Day Wellness Score Trend").classes(TextStyles.SUBHEADING)

                    # Simple trend display
                    if len(scores) > 1:
                        latest_score = scores[-1]
                        previous_score = scores[-2]
                        change = latest_score - previous_score
                        trend_emoji = "📈" if change > 0 else "📉" if change < 0 else "➡️"

                        ui.label(
                            f"{trend_emoji} Latest: {latest_score:.1f} ({'+' if change > 0 else ''}{change:.1f} from previous)"
                        ).classes("text-lg")

                    # Display trend data in a simple format
                    for i, trend in enumerate(trends_30[-7:]):  # Show last 7 days
                        ui.label(f"{trend.entry_date}: {trend.wellness_score}").classes("text-sm text-gray-600")

                # Sleep patterns
                with ui.card().classes("flex-1 p-6"):
                    ui.label("Sleep Pattern Analysis").classes(TextStyles.SUBHEADING)

                    avg_sleep = sum(float(t.sleep_hours) for t in trends_30) / len(trends_30)
                    sleep_consistency = (
                        len([t for t in trends_30 if 7 <= float(t.sleep_hours) <= 9]) / len(trends_30) * 100
                    )

                    ui.label(f"Average Sleep: {avg_sleep:.1f} hours").classes("text-base mb-2")
                    ui.label(f"Optimal Range (7-9h): {sleep_consistency:.0f}% of days").classes("text-base")
            else:
                ui.label("No trend data available. Start tracking to see patterns!").classes(
                    "text-center text-gray-500 p-8"
                )

        # Page styling
        ui.add_head_html("""<style>
            .nicegui-content {
                padding: 2rem;
                background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
                min-height: 100vh;
            }
        </style>""")

    # Navigation between pages
    @ui.page("/")
    def index():
        ui.navigate.to("/wellness")
