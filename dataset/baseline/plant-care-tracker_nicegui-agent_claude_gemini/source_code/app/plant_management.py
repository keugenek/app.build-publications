"""Plant management module for adding, editing, and viewing plants."""

from nicegui import ui
from app.plant_service import PlantService
from app.models import PlantCreate, PlantUpdate, PlantType
from datetime import date
from typing import Optional


def create_plant_form(plant_id: Optional[int] = None):
    """Create a form for adding or editing a plant."""
    is_edit = plant_id is not None
    existing_plant = PlantService.get_plant_by_id(plant_id) if is_edit else None

    # Form state
    form_data = {
        "name": existing_plant.name if existing_plant else "",
        "scientific_name": existing_plant.scientific_name if existing_plant else "",
        "plant_type": existing_plant.plant_type if existing_plant else PlantType.TROPICAL,
        "location": existing_plant.location if existing_plant else "",
        "watering_frequency_days": existing_plant.watering_frequency_days if existing_plant else 7,
        "notes": existing_plant.notes if existing_plant else "",
        "acquired_date": existing_plant.acquired_date if existing_plant else None,
        "last_watered": existing_plant.last_watered if existing_plant else None,
    }

    with ui.card().classes("w-full max-w-2xl mx-auto p-8 shadow-lg"):
        # Header
        title = "Edit Plant" if is_edit else "Add New Plant"
        ui.label(f"🌱 {title}").classes("text-2xl font-bold text-gray-800 mb-6")

        with ui.column().classes("gap-4"):
            # Basic Information Section
            ui.label("Basic Information").classes("text-lg font-semibold text-gray-700 mb-2")

            with ui.row().classes("gap-4 w-full"):
                name_input = (
                    ui.input(label="Plant Name", placeholder="e.g., My Monstera", value=form_data["name"])
                    .classes("flex-1")
                    .props("outlined")
                )

                scientific_input = (
                    ui.input(
                        label="Scientific Name (optional)",
                        placeholder="e.g., Monstera deliciosa",
                        value=form_data["scientific_name"] or "",
                    )
                    .classes("flex-1")
                    .props("outlined")
                )

            with ui.row().classes("gap-4 w-full"):
                plant_type_select = (
                    ui.select(
                        label="Plant Type", options=[t.value for t in PlantType], value=form_data["plant_type"].value
                    )
                    .classes("flex-1")
                    .props("outlined")
                )

                location_input = (
                    ui.input(label="Location", placeholder="e.g., Living room window", value=form_data["location"])
                    .classes("flex-1")
                    .props("outlined")
                )

            # Care Information Section
            ui.label("Care Information").classes("text-lg font-semibold text-gray-700 mb-2 mt-4")

            with ui.row().classes("gap-4 w-full"):
                frequency_input = (
                    ui.number(
                        label="Watering Frequency (days)", value=form_data["watering_frequency_days"], min=1, max=365
                    )
                    .classes("w-48")
                    .props("outlined")
                )

                with ui.column().classes("flex-1 gap-2"):
                    ui.label("Common watering frequencies:").classes("text-sm text-gray-600")
                    frequency_hints = [
                        ("Succulents/Cacti", "10-14 days"),
                        ("Tropical plants", "5-7 days"),
                        ("Herbs", "2-3 days"),
                        ("Ferns", "3-5 days"),
                    ]
                    for plant_type, freq in frequency_hints:
                        ui.label(f"• {plant_type}: {freq}").classes("text-xs text-gray-500")

            # Dates Section
            ui.label("Important Dates").classes("text-lg font-semibold text-gray-700 mb-2 mt-4")

            with ui.row().classes("gap-4"):
                acquired_date = (
                    ui.date(value=form_data["acquired_date"].isoformat() if form_data["acquired_date"] else None)
                    .classes("w-48")
                    .props("outlined label='Acquired Date (optional)'")
                )

                last_watered_date = (
                    ui.date(value=form_data["last_watered"].isoformat() if form_data["last_watered"] else None)
                    .classes("w-48")
                    .props("outlined label='Last Watered (optional)'")
                )

            # Notes Section
            notes_input = (
                ui.textarea(
                    label="Notes (optional)",
                    placeholder="Any special care instructions, observations, or notes...",
                    value=form_data["notes"],
                )
                .classes("w-full")
                .props("outlined rows=3")
            )

            # Action buttons
            with ui.row().classes("gap-4 justify-end mt-6"):
                ui.button("Cancel", on_click=lambda: ui.navigate.to("/")).classes("px-6 py-2").props(
                    "outline color=grey"
                )

                async def save_plant():
                    """Save the plant data."""
                    try:
                        # Validate required fields
                        if not name_input.value or not name_input.value.strip():
                            ui.notify("Plant name is required", type="negative")
                            return

                        if not location_input.value or not location_input.value.strip():
                            ui.notify("Location is required", type="negative")
                            return

                        # Prepare plant data
                        plant_data = {
                            "name": name_input.value.strip(),
                            "scientific_name": scientific_input.value.strip() if scientific_input.value else None,
                            "plant_type": PlantType(plant_type_select.value),
                            "location": location_input.value.strip(),
                            "watering_frequency_days": int(frequency_input.value),
                            "notes": notes_input.value.strip() if notes_input.value else "",
                            "acquired_date": date.fromisoformat(acquired_date.value) if acquired_date.value else None,
                            "last_watered": date.fromisoformat(last_watered_date.value)
                            if last_watered_date.value
                            else None,
                        }

                        if is_edit and existing_plant and plant_id is not None:
                            # Update existing plant
                            updated_plant = PlantService.update_plant(plant_id, PlantUpdate(**plant_data))
                            if updated_plant:
                                ui.notify("Plant updated successfully! 🌱", type="positive")
                                ui.navigate.to("/")
                            else:
                                ui.notify("Failed to update plant", type="negative")
                        else:
                            # Create new plant
                            new_plant = PlantService.create_plant(PlantCreate(**plant_data))
                            ui.notify(f"Welcome {new_plant.name} to your plant family! 🌿", type="positive")
                            ui.navigate.to("/")

                    except Exception as e:
                        import logging

                        logger = logging.getLogger(__name__)
                        logger.error(f"Error saving plant: {str(e)}")
                        ui.notify(f"Error saving plant: {str(e)}", type="negative")

                save_text = "Update Plant" if is_edit else "Add Plant"
                ui.button(save_text, on_click=save_plant).classes(
                    "px-6 py-2 bg-green-500 text-white hover:bg-green-600"
                )

    # Plant care tips sidebar
    with ui.card().classes("w-full max-w-md mx-auto mt-6 p-6 bg-green-50 border-l-4 border-green-400"):
        ui.label("🌿 Plant Care Tips").classes("text-lg font-semibold text-green-700 mb-3")

        tips = [
            "Most houseplants prefer indirect bright light",
            "Water when the top inch of soil feels dry",
            "Check for pests regularly by inspecting leaves",
            "Rotate plants weekly for even growth",
            "Use room temperature water when watering",
            "Group plants together to increase humidity",
        ]

        for tip in tips:
            ui.label(f"• {tip}").classes("text-sm text-green-600 mb-2")


def create_plant_detail_view(plant_id: int):
    """Create a detailed view of a single plant."""
    plant = PlantService.get_plant_by_id(plant_id)

    if not plant:
        with ui.card().classes("w-full max-w-md mx-auto p-8 text-center"):
            ui.label("🚫").classes("text-6xl mb-4")
            ui.label("Plant not found").classes("text-xl font-bold text-gray-600 mb-2")
            ui.button("Back to Dashboard", on_click=lambda: ui.navigate.to("/")).classes("mt-4")
        return

    from app.dashboard import get_mood_config

    mood_config = get_mood_config(plant.mood)

    with ui.column().classes("w-full max-w-4xl mx-auto gap-6"):
        # Back button
        ui.button("← Back to Dashboard", on_click=lambda: ui.navigate.to("/")).classes("mb-4").props("outline")

        # Plant header card
        with ui.card().classes(f"w-full p-8 {mood_config['bg_color']} {mood_config['border_color']} border-2"):
            with ui.row().classes("w-full items-center justify-between"):
                with ui.column():
                    ui.label(plant.name).classes("text-3xl font-bold text-gray-800")
                    if plant.scientific_name:
                        ui.label(plant.scientific_name).classes("text-lg italic text-gray-600")
                    ui.label(f"{plant.plant_type.value} • {plant.location}").classes("text-base text-gray-600")

                with ui.column().classes("items-center"):
                    ui.label(mood_config["emoji"]).classes("text-6xl mb-2")
                    ui.label(plant.mood.value).classes(f"text-xl font-bold {mood_config['text_color']}")
                    ui.label(mood_config["message"]).classes(f"text-sm {mood_config['text_color']} text-center")

        # Quick actions
        with ui.row().classes("gap-4"):

            def create_water_handler(plant_id_val=plant.id):
                return lambda: water_plant_quick(plant_id_val) if plant_id_val is not None else None

            ui.button("💧 Water Now", on_click=create_water_handler()).classes(
                "px-4 py-2 bg-blue-500 text-white hover:bg-blue-600"
            )

            def create_edit_handler(plant_id_val=plant.id):
                return lambda: ui.navigate.to(f"/plants/{plant_id_val}/edit") if plant_id_val is not None else None

            ui.button("✏️ Edit Plant", on_click=create_edit_handler()).classes(
                "px-4 py-2 bg-orange-500 text-white hover:bg-orange-600"
            )

            async def delete_plant():
                """Delete the plant with confirmation."""
                with ui.dialog() as dialog, ui.card():
                    ui.label(f"Delete {plant.name}?").classes("text-lg font-bold mb-4")
                    ui.label("This action cannot be undone.").classes("text-gray-600 mb-4")
                    with ui.row().classes("gap-2 justify-end"):
                        ui.button("Cancel", on_click=lambda: dialog.submit(False)).props("outline")
                        ui.button("Delete", on_click=lambda: dialog.submit(True)).props("color=negative")

                result = await dialog
                if result and plant.id is not None:
                    success = PlantService.delete_plant(plant.id)
                    if success:
                        ui.notify(f"Goodbye {plant.name}! 👋", type="warning")
                        ui.navigate.to("/")
                    else:
                        ui.notify("Failed to delete plant", type="negative")

            ui.button("🗑️ Delete", on_click=delete_plant).classes("px-4 py-2 bg-red-500 text-white hover:bg-red-600")

        # Plant details and watering history
        with ui.row().classes("gap-6 w-full"):
            # Plant details
            with ui.card().classes("flex-1 p-6"):
                ui.label("Plant Details").classes("text-lg font-bold mb-4")

                details = [
                    ("Watering Frequency", f"Every {plant.watering_frequency_days} days"),
                    ("Last Watered", plant.last_watered.strftime("%B %d, %Y") if plant.last_watered else "Never"),
                    (
                        "Next Watering",
                        plant.next_watering_date.strftime("%B %d, %Y") if plant.next_watering_date else "Unknown",
                    ),
                    ("Acquired", plant.acquired_date.strftime("%B %d, %Y") if plant.acquired_date else "Unknown"),
                    (
                        "Days Since Watered",
                        f"{plant.days_since_watered} days" if plant.days_since_watered is not None else "Never",
                    ),
                ]

                for label, value in details:
                    with ui.row().classes("justify-between mb-2"):
                        ui.label(f"{label}:").classes("font-medium text-gray-700")
                        ui.label(str(value)).classes("text-gray-600")

                if plant.notes:
                    ui.label("Notes:").classes("font-medium text-gray-700 mt-4 mb-2")
                    ui.label(plant.notes).classes("text-gray-600 text-sm")

            # Watering history
            with ui.card().classes("flex-1 p-6"):
                ui.label("Recent Watering History").classes("text-lg font-bold mb-4")

                if plant.id is not None:
                    watering_history = PlantService.get_watering_history(plant.id, limit=5)
                else:
                    watering_history = []

                if not watering_history:
                    ui.label("No watering records yet").classes("text-gray-500 text-center py-4")
                else:
                    for record in watering_history:
                        with ui.row().classes("justify-between items-center py-2 border-b border-gray-200"):
                            ui.label(record.watered_date.strftime("%b %d, %Y")).classes("font-medium")
                            if record.amount_ml:
                                ui.label(f"{record.amount_ml}ml").classes("text-sm text-gray-600")


async def water_plant_quick(plant_id: int):
    """Quick water a plant with today's date."""
    from app.models import WateringRecordCreate

    try:
        watering_data = WateringRecordCreate(
            plant_id=plant_id, watered_date=date.today(), notes="Quick watered from plant detail view"
        )

        updated_plant = PlantService.water_plant(plant_id, watering_data)
        if updated_plant:
            ui.notify(f"{updated_plant.name} has been watered! 💧", type="positive")
            # Refresh the page to show updated mood
            ui.navigate.to(f"/plants/{plant_id}")
        else:
            ui.notify("Failed to water plant", type="negative")
    except Exception as e:
        import logging

        logger = logging.getLogger(__name__)
        logger.error(f"Error watering plant {plant_id}: {str(e)}")
        ui.notify(f"Error watering plant: {str(e)}", type="negative")


def create():
    """Create plant management pages."""

    @ui.page("/plants/add")
    def add_plant():
        ui.colors(primary="#10b981")
        with ui.column().classes("w-full max-w-4xl mx-auto p-6"):
            create_plant_form()

    @ui.page("/plants/{plant_id}/edit")
    def edit_plant(plant_id: int):
        ui.colors(primary="#10b981")
        with ui.column().classes("w-full max-w-4xl mx-auto p-6"):
            create_plant_form(plant_id)

    @ui.page("/plants/{plant_id}")
    def plant_detail(plant_id: int):
        ui.colors(primary="#10b981")
        with ui.column().classes("w-full mx-auto p-6"):
            create_plant_detail_view(plant_id)
