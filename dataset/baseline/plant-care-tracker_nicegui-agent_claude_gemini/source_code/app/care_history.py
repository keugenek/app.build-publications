"""Plant care history and analytics module."""

from nicegui import ui
from app.plant_service import PlantService
from app.models import PlantMood
from datetime import date, timedelta
import calendar


def create_watering_history_table():
    """Create a table showing recent watering history across all plants."""
    # Get all watering records from all plants
    all_plants = PlantService.get_all_active_plants()
    all_records = []

    for plant in all_plants:
        if plant.id is not None:
            records = PlantService.get_watering_history(plant.id, limit=20)
        else:
            continue
        for record in records:
            all_records.append(
                {
                    "plant_name": plant.name,
                    "plant_location": plant.location,
                    "plant_id": plant.id,
                    "date": record.watered_date,
                    "amount_ml": record.amount_ml,
                    "notes": record.notes,
                    "created_at": record.created_at,
                }
            )

    # Sort by date (newest first)
    all_records.sort(key=lambda x: x["date"], reverse=True)

    # Take only the most recent 50 records
    recent_records = all_records[:50]

    if not recent_records:
        with ui.card().classes("w-full p-8 text-center bg-gray-50"):
            ui.label("📊").classes("text-6xl mb-4")
            ui.label("No watering history yet").classes("text-xl font-bold text-gray-600 mb-2")
            ui.label("Start watering your plants to see history here").classes("text-gray-500")
        return

    # Create columns for the table
    columns = [
        {"name": "date", "label": "Date", "field": "date", "sortable": True, "align": "left"},
        {"name": "plant", "label": "Plant", "field": "plant_name", "sortable": True, "align": "left"},
        {"name": "location", "label": "Location", "field": "plant_location", "sortable": True, "align": "left"},
        {"name": "amount", "label": "Amount", "field": "amount_ml", "sortable": True, "align": "center"},
        {"name": "notes", "label": "Notes", "field": "notes", "sortable": False, "align": "left"},
    ]

    # Format data for the table
    rows = []
    for record in recent_records:
        rows.append(
            {
                "date": record["date"].strftime("%b %d, %Y"),
                "plant_name": record["plant_name"],
                "plant_location": record["plant_location"],
                "amount_ml": f"{record['amount_ml']}ml" if record["amount_ml"] else "—",
                "notes": record["notes"] if record["notes"] else "—",
            }
        )

    with ui.card().classes("w-full p-6"):
        ui.label("📊 Recent Watering History").classes("text-2xl font-bold text-gray-800 mb-4")
        ui.label(f"Showing {len(rows)} most recent watering events").classes("text-gray-600 mb-4")

        ui.table(
            columns=columns, rows=rows, pagination={"rowsPerPage": 20, "sortBy": "date", "descending": True}
        ).classes("w-full").props("flat bordered")


def create_care_statistics():
    """Create statistics about plant care."""
    stats = PlantService.get_plant_statistics()
    all_plants = PlantService.get_all_active_plants()

    with ui.row().classes("gap-6 mb-6 w-full justify-center flex-wrap"):
        # Total plants
        with ui.card().classes("p-6 bg-gradient-to-br from-green-500 to-green-600 text-white min-w-48"):
            with ui.column().classes("items-center gap-2"):
                ui.label("🌱").classes("text-4xl")
                ui.label(str(stats["total_plants"])).classes("text-3xl font-bold")
                ui.label("Total Plants").classes("text-sm opacity-90")

        # Average days since watering
        if all_plants:
            watered_plants = [p for p in all_plants if p.days_since_watered is not None]
            if watered_plants:
                avg_days = sum(p.days_since_watered for p in watered_plants if p.days_since_watered is not None) / len(
                    watered_plants
                )
            else:
                avg_days = 0

            with ui.card().classes("p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white min-w-48"):
                with ui.column().classes("items-center gap-2"):
                    ui.label("📅").classes("text-4xl")
                    ui.label(f"{avg_days:.1f}").classes("text-3xl font-bold")
                    ui.label("Avg Days Since Watering").classes("text-sm opacity-90")

        # Plants watered today
        today = date.today()
        plants_watered_today = len([p for p in all_plants if p.last_watered == today])

        with ui.card().classes("p-6 bg-gradient-to-br from-cyan-500 to-cyan-600 text-white min-w-48"):
            with ui.column().classes("items-center gap-2"):
                ui.label("💧").classes("text-4xl")
                ui.label(str(plants_watered_today)).classes("text-3xl font-bold")
                ui.label("Watered Today").classes("text-sm opacity-90")

        # Most overdue plant
        overdue_plants = [p for p in all_plants if p.is_due_for_watering and p.days_since_watered is not None]
        if overdue_plants:
            most_overdue = max(overdue_plants, key=lambda p: p.days_since_watered or 0)
            overdue_days = most_overdue.days_since_watered

            with ui.card().classes("p-6 bg-gradient-to-br from-red-500 to-red-600 text-white min-w-48"):
                with ui.column().classes("items-center gap-2"):
                    ui.label("🚨").classes("text-4xl")
                    ui.label(f"{overdue_days}d").classes("text-3xl font-bold")
                    ui.label("Most Overdue").classes("text-sm opacity-90")


def create_mood_distribution_chart():
    """Create a visual representation of plant mood distribution."""
    stats = PlantService.get_plant_statistics()
    mood_data = stats.get("mood_distribution", {})

    if not mood_data or sum(mood_data.values()) == 0:
        return

    with ui.card().classes("w-full p-6"):
        ui.label("😊 Plant Mood Distribution").classes("text-2xl font-bold text-gray-800 mb-4")

        from app.dashboard import get_mood_config

        with ui.row().classes("gap-4 flex-wrap justify-center"):
            for mood_name, count in mood_data.items():
                if count > 0:
                    try:
                        mood = PlantMood(mood_name)
                        mood_config = get_mood_config(mood)

                        with ui.card().classes(
                            f"p-4 {mood_config['bg_color']} {mood_config['border_color']} border-2 min-w-32"
                        ):
                            with ui.column().classes("items-center gap-2"):
                                ui.label(mood_config["emoji"]).classes("text-3xl")
                                ui.label(str(count)).classes("text-2xl font-bold text-gray-800")
                                ui.label(mood_name).classes(f"text-sm {mood_config['text_color']} font-medium")
                    except ValueError as e:
                        import logging

                        logger = logging.getLogger(__name__)
                        logger.warning(f"Invalid mood value '{mood_name}': {str(e)}")
                        continue  # Skip invalid mood values


def create_weekly_watering_calendar():
    """Create a simple weekly watering calendar view."""
    all_plants = PlantService.get_all_active_plants()

    # Get the current week
    today = date.today()
    start_of_week = today - timedelta(days=today.weekday())  # Monday
    week_dates = [start_of_week + timedelta(days=i) for i in range(7)]

    with ui.card().classes("w-full p-6"):
        ui.label("📅 This Week's Watering").classes("text-2xl font-bold text-gray-800 mb-4")

        with ui.row().classes("gap-2 w-full"):
            for i, day_date in enumerate(week_dates):
                day_name = calendar.day_name[day_date.weekday()][:3]  # Mon, Tue, etc.
                is_today = day_date == today

                # Find plants watered on this day
                plants_watered = [p for p in all_plants if p.last_watered == day_date]

                # Find plants that should be watered on this day
                plants_due = [p for p in all_plants if p.next_watering_date == day_date]

                card_class = "flex-1 p-3 min-h-24"
                if is_today:
                    card_class += " bg-blue-50 border-2 border-blue-300"
                else:
                    card_class += " bg-gray-50"

                with ui.card().classes(card_class):
                    with ui.column().classes("gap-1 items-center"):
                        ui.label(day_name).classes("text-sm font-semibold text-gray-700")
                        ui.label(day_date.strftime("%d")).classes("text-lg font-bold text-gray-800")

                        if plants_watered:
                            ui.label(f"💧 {len(plants_watered)}").classes("text-xs text-blue-600")

                        if plants_due:
                            ui.label(f"🚨 {len(plants_due)}").classes("text-xs text-red-600")

                        if not plants_watered and not plants_due:
                            ui.label("—").classes("text-xs text-gray-400")


def create_plant_care_tips():
    """Create a section with helpful plant care tips."""
    with ui.card().classes("w-full p-6 bg-gradient-to-br from-green-50 to-blue-50 border-l-4 border-green-400"):
        ui.label("🌿 Plant Care Tips & Reminders").classes("text-xl font-bold text-green-700 mb-4")

        tips = [
            {
                "title": "Watering Best Practices",
                "content": "Water thoroughly until it drains from the bottom, then wait until the top inch of soil is dry before watering again.",
            },
            {
                "title": "Signs of Overwatering",
                "content": "Yellow leaves, musty smell from soil, or fungus gnats are signs you might be watering too frequently.",
            },
            {
                "title": "Signs of Underwatering",
                "content": "Wilting, dry or crispy leaf edges, and soil pulling away from the pot edges indicate your plant needs water.",
            },
            {
                "title": "Seasonal Care Adjustments",
                "content": "Reduce watering frequency in winter when plant growth slows down, and increase in spring/summer.",
            },
        ]

        with ui.column().classes("gap-3"):
            for tip in tips:
                with ui.row().classes("gap-3 items-start"):
                    ui.label("💡").classes("text-lg text-yellow-500 mt-1")
                    with ui.column():
                        ui.label(tip["title"]).classes("font-semibold text-green-700")
                        ui.label(tip["content"]).classes("text-sm text-green-600")


def create():
    """Create the care history page."""

    @ui.page("/history")
    def history_page():
        ui.colors(primary="#10b981")

        with ui.column().classes("w-full max-w-6xl mx-auto p-6 gap-6"):
            # Header
            with ui.row().classes("w-full items-center justify-between mb-6"):
                with ui.column():
                    ui.label("📊 Plant Care History").classes("text-3xl font-bold text-gray-800 mb-2")
                    ui.label("Track your plant care journey and statistics").classes("text-lg text-gray-600")

                ui.button("← Back to Dashboard", on_click=lambda: ui.navigate.to("/")).props("outline")

            # Statistics overview
            create_care_statistics()

            # Weekly calendar
            create_weekly_watering_calendar()

            # Mood distribution
            create_mood_distribution_chart()

            # Watering history table
            create_watering_history_table()

            # Care tips
            create_plant_care_tips()
