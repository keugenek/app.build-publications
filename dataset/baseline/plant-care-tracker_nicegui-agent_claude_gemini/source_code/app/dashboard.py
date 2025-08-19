"""Plant dashboard with mood visualization and statistics."""

from nicegui import ui
from app.plant_service import PlantService
from app.models import PlantMood
from datetime import date


def get_mood_config(mood: PlantMood) -> dict:
    """Get emoji, color, and message for each plant mood."""
    mood_configs = {
        PlantMood.HAPPY: {
            "emoji": "😊",
            "color": "green",
            "bg_color": "bg-green-50",
            "border_color": "border-green-200",
            "text_color": "text-green-700",
            "message": "I'm thriving!",
            "description": "Recently watered and content",
        },
        PlantMood.CONTENT: {
            "emoji": "🙂",
            "color": "blue",
            "bg_color": "bg-blue-50",
            "border_color": "border-blue-200",
            "text_color": "text-blue-700",
            "message": "Doing well",
            "description": "Comfortable and stable",
        },
        PlantMood.THIRSTY: {
            "emoji": "😅",
            "color": "orange",
            "bg_color": "bg-orange-50",
            "border_color": "border-orange-200",
            "text_color": "text-orange-700",
            "message": "I could use some water...",
            "description": "Getting a bit thirsty",
        },
        PlantMood.DYING: {
            "emoji": "😰",
            "color": "red",
            "bg_color": "bg-red-50",
            "border_color": "border-red-200",
            "text_color": "text-red-700",
            "message": "Help! I need water now!",
            "description": "Seriously dehydrated",
        },
        PlantMood.DROWNING: {
            "emoji": "🤢",
            "color": "purple",
            "bg_color": "bg-purple-50",
            "border_color": "border-purple-200",
            "text_color": "text-purple-700",
            "message": "Too much water or neglected...",
            "description": "Overwatered or severely neglected",
        },
    }
    return mood_configs.get(mood, mood_configs[PlantMood.CONTENT])


def create_plant_card(plant):
    """Create an engaging plant card with mood visualization."""
    mood_config = get_mood_config(plant.mood)

    with ui.card().classes(
        f"w-80 h-64 {mood_config['bg_color']} {mood_config['border_color']} border-2 "
        f"hover:shadow-lg transition-all duration-300 cursor-pointer relative overflow-hidden"
    ):
        # Mood emoji in top right corner
        ui.label(mood_config["emoji"]).classes("absolute top-2 right-2 text-4xl animate-pulse").style(
            "animation-duration: 2s"
        )

        with ui.column().classes("p-4 h-full justify-between"):
            # Plant name and type
            with ui.column().classes("gap-1"):
                ui.label(plant.name).classes("text-xl font-bold text-gray-800")
                ui.label(f"{plant.plant_type.value} • {plant.location}").classes("text-sm text-gray-600")

                if plant.scientific_name:
                    ui.label(plant.scientific_name).classes("text-sm italic text-gray-500")

            # Mood message
            ui.label(mood_config["message"]).classes(
                f"text-base font-medium {mood_config['text_color']} text-center py-2 px-3 "
                f"bg-white bg-opacity-50 rounded-lg"
            )

            # Watering info
            with ui.column().classes("gap-1 text-sm text-gray-600"):
                if plant.last_watered:
                    days_ago = (date.today() - plant.last_watered).days
                    if days_ago == 0:
                        water_text = "Watered today"
                    elif days_ago == 1:
                        water_text = "Watered yesterday"
                    else:
                        water_text = f"Watered {days_ago} days ago"
                    ui.label(f"💧 {water_text}")
                else:
                    ui.label("💧 Never watered")

                if plant.next_watering_date:
                    days_until = (plant.next_watering_date - date.today()).days
                    if days_until <= 0:
                        next_text = "Due now!"
                    elif days_until == 1:
                        next_text = "Due tomorrow"
                    else:
                        next_text = f"Due in {days_until} days"
                    ui.label(f"📅 {next_text}")

    return mood_config


def create_statistics_overview():
    """Create an overview of plant statistics."""
    stats = PlantService.get_plant_statistics()

    with ui.row().classes("gap-6 mb-6 w-full justify-center"):
        # Total plants
        with ui.card().classes("p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white min-w-48"):
            with ui.column().classes("items-center gap-2"):
                ui.label("🌱").classes("text-4xl")
                ui.label(str(stats["total_plants"])).classes("text-3xl font-bold")
                ui.label("Total Plants").classes("text-sm opacity-90")

        # Plants needing water
        with ui.card().classes("p-6 bg-gradient-to-br from-orange-500 to-red-500 text-white min-w-48"):
            with ui.column().classes("items-center gap-2"):
                ui.label("🚨").classes("text-4xl")
                ui.label(str(stats["plants_needing_water"])).classes("text-3xl font-bold")
                ui.label("Need Water").classes("text-sm opacity-90")

        # Happy plants
        with ui.card().classes("p-6 bg-gradient-to-br from-green-500 to-green-600 text-white min-w-48"):
            with ui.column().classes("items-center gap-2"):
                ui.label("😊").classes("text-4xl")
                ui.label(str(stats["happy_plants"])).classes("text-3xl font-bold")
                ui.label("Happy Plants").classes("text-sm opacity-90")


def create_mood_filter_buttons():
    """Create filter buttons for different plant moods."""
    with ui.row().classes("gap-2 mb-6 flex-wrap justify-center"):
        ui.button("All Plants", on_click=lambda: show_plants()).classes(
            "px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
        )

        for mood in PlantMood:
            mood_config = get_mood_config(mood)
            plants_count = len(PlantService.get_plants_by_mood(mood))

            def create_mood_filter(mood_val=mood):
                return lambda: show_plants_by_mood(mood_val)

            ui.button(f"{mood_config['emoji']} {mood.value} ({plants_count})", on_click=create_mood_filter()).classes(
                f"px-4 py-2 bg-{mood_config['color']}-500 text-white rounded-lg hover:bg-{mood_config['color']}-600"
            )


@ui.refreshable
def show_plants(plants=None):
    """Display plant cards in a responsive grid."""
    if plants is None:
        plants = PlantService.get_all_active_plants()

    if not plants:
        with ui.card().classes("w-full p-12 text-center bg-gray-50"):
            ui.label("🌿").classes("text-6xl mb-4")
            ui.label("No plants yet!").classes("text-2xl font-bold text-gray-600 mb-2")
            ui.label("Add your first plant to get started").classes("text-gray-500")
        return

    with ui.row().classes("gap-6 w-full flex-wrap justify-center"):
        for plant in plants:
            create_plant_card(plant)


def show_plants_by_mood(mood: PlantMood):
    """Filter plants by mood and refresh the display."""
    plants = PlantService.get_plants_by_mood(mood)
    show_plants.refresh(plants)


def create_quick_actions():
    """Create quick action buttons."""
    with ui.row().classes("gap-4 mb-6 justify-center"):
        ui.button("🌱 Add Plant", on_click=lambda: ui.navigate.to("/plants/add")).classes(
            "px-6 py-3 bg-green-500 text-white rounded-lg font-semibold "
            "hover:bg-green-600 shadow-md hover:shadow-lg transition-all"
        )

        ui.button("💧 Quick Water", on_click=lambda: ui.navigate.to("/water")).classes(
            "px-6 py-3 bg-blue-500 text-white rounded-lg font-semibold "
            "hover:bg-blue-600 shadow-md hover:shadow-lg transition-all"
        )

        ui.button("📊 Care Log", on_click=lambda: ui.navigate.to("/history")).classes(
            "px-6 py-3 bg-purple-500 text-white rounded-lg font-semibold "
            "hover:bg-purple-600 shadow-md hover:shadow-lg transition-all"
        )


def create():
    """Create the main dashboard page."""

    @ui.page("/")
    def dashboard():
        # Apply modern theme
        ui.colors(
            primary="#10b981",
            secondary="#64748b",
            accent="#3b82f6",
            positive="#10b981",
            negative="#ef4444",
            warning="#f59e0b",
            info="#3b82f6",
        )

        with ui.column().classes("w-full max-w-7xl mx-auto p-6 gap-8"):
            # Header
            with ui.row().classes("w-full items-center justify-between mb-6"):
                with ui.column():
                    ui.label("🌿 Plant Care Dashboard").classes("text-4xl font-bold text-gray-800 mb-2")
                    ui.label("Keep track of your green friends and their moods").classes("text-lg text-gray-600")

                # Auto-refresh toggle
                refresh_enabled = ui.switch("Auto-refresh", value=True).classes("ml-4")

            # Statistics overview
            create_statistics_overview()

            # Quick actions
            create_quick_actions()

            # Mood filter buttons
            create_mood_filter_buttons()

            # Plants display
            show_plants()

            # Auto-refresh timer
            async def auto_refresh():
                if refresh_enabled.value:
                    show_plants.refresh()
                    # Refresh statistics by recreating the page elements would be complex,
                    # so we'll just refresh the plants for now

            ui.timer(30.0, auto_refresh)  # Refresh every 30 seconds

        # Add some custom CSS for animations
        ui.add_head_html("""
        <style>
        @keyframes gentle-pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
        }
        
        .animate-gentle-pulse {
            animation: gentle-pulse 3s ease-in-out infinite;
        }
        
        @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
        }
        
        .animate-float {
            animation: float 4s ease-in-out infinite;
        }
        </style>
        """)
