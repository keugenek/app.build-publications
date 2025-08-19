"""Watering tracking module for recording plant watering events."""

from nicegui import ui
from app.plant_service import PlantService
from app.models import WateringRecordCreate
from datetime import date


def create_watering_interface():
    """Create the main watering interface."""
    plants = PlantService.get_all_active_plants()

    if not plants:
        with ui.card().classes("w-full max-w-md mx-auto p-8 text-center bg-gray-50"):
            ui.label("🌿").classes("text-6xl mb-4")
            ui.label("No plants to water yet!").classes("text-xl font-bold text-gray-600 mb-2")
            ui.label("Add your first plant to get started").classes("text-gray-500 mb-4")
            ui.button("Add Plant", on_click=lambda: ui.navigate.to("/plants/add")).classes(
                "px-4 py-2 bg-green-500 text-white hover:bg-green-600"
            )
        return

    # Quick watering section
    create_quick_watering_section(plants)

    # Detailed watering form
    create_detailed_watering_form(plants)

    # Plants needing water
    create_plants_needing_water_section()


def create_quick_watering_section(plants):
    """Create quick watering buttons for all plants."""
    with ui.card().classes("w-full max-w-4xl mx-auto p-6 mb-6"):
        ui.label("💧 Quick Watering").classes("text-2xl font-bold text-gray-800 mb-4")
        ui.label("Water plants with today's date and default settings").classes("text-gray-600 mb-4")

        with ui.row().classes("gap-4 flex-wrap"):
            for plant in plants:
                from app.dashboard import get_mood_config

                mood_config = get_mood_config(plant.mood)

                async def quick_water(plant_id=plant.id, plant_name=plant.name):
                    """Quick water a plant."""
                    try:
                        watering_data = WateringRecordCreate(
                            plant_id=plant_id, watered_date=date.today(), notes="Quick watered"
                        )

                        updated_plant = PlantService.water_plant(plant_id, watering_data)
                        if updated_plant:
                            ui.notify(f"{plant_name} has been watered! 💧", type="positive")
                            # Refresh the interface
                            ui.navigate.to("/water")
                        else:
                            ui.notify("Failed to water plant", type="negative")
                    except Exception as e:
                        import logging

                        logger = logging.getLogger(__name__)
                        logger.error(f"Error watering {plant_name}: {str(e)}")
                        ui.notify(f"Error watering {plant_name}: {str(e)}", type="negative")

                # Create button with plant mood styling
                with ui.button(f"{mood_config['emoji']} {plant.name}", on_click=quick_water).classes(
                    f"px-4 py-3 {mood_config['bg_color']} {mood_config['border_color']} "
                    f"border-2 {mood_config['text_color']} hover:shadow-md transition-all"
                ):
                    if plant.is_due_for_watering:
                        ui.badge("DUE", color="red").classes("absolute -top-2 -right-2")


def create_detailed_watering_form(plants):
    """Create detailed watering form with more options."""
    with ui.card().classes("w-full max-w-2xl mx-auto p-6 mb-6"):
        ui.label("📝 Detailed Watering Log").classes("text-2xl font-bold text-gray-800 mb-4")
        ui.label("Record detailed watering information").classes("text-gray-600 mb-4")

        # Form fields
        with ui.column().classes("gap-4"):
            # Plant selection
            plant_options = {plant.id: f"{plant.name} ({plant.location})" for plant in plants if plant.id is not None}
            selected_plant = (
                ui.select(label="Select Plant", options=plant_options, value=None).classes("w-full").props("outlined")
            )

            # Watering date
            watering_date = (
                ui.date(value=date.today().isoformat()).classes("w-full").props("outlined label='Watering Date'")
            )

            # Water amount
            with ui.row().classes("gap-4 items-end"):
                water_amount = (
                    ui.number(label="Water Amount (ml, optional)", min=0, max=10000, step=50)
                    .classes("flex-1")
                    .props("outlined")
                )

                # Common amounts
                with ui.column().classes("gap-1"):
                    ui.label("Common amounts:").classes("text-sm text-gray-600")
                    amounts = [
                        ("Small plant", "100-200ml"),
                        ("Medium plant", "300-500ml"),
                        ("Large plant", "500-1000ml"),
                    ]
                    for plant_size, amount in amounts:
                        ui.label(f"• {plant_size}: {amount}").classes("text-xs text-gray-500")

            # Notes
            notes_input = (
                ui.textarea(
                    label="Notes (optional)", placeholder="Any observations about the plant, soil condition, etc..."
                )
                .classes("w-full")
                .props("outlined rows=3")
            )

            # Submit button
            async def submit_watering():
                """Submit the detailed watering form."""
                if not selected_plant.value:
                    ui.notify("Please select a plant", type="negative")
                    return

                if not watering_date.value:
                    ui.notify("Please select a watering date", type="negative")
                    return

                try:
                    watering_data = WateringRecordCreate(
                        plant_id=int(selected_plant.value),
                        watered_date=date.fromisoformat(watering_date.value),
                        amount_ml=int(water_amount.value) if water_amount.value else None,
                        notes=notes_input.value.strip() if notes_input.value else "",
                    )

                    plant_name = plant_options[int(selected_plant.value)]
                    updated_plant = PlantService.water_plant(int(selected_plant.value), watering_data)

                    if updated_plant:
                        ui.notify(f"Watering logged for {plant_name.split('(')[0].strip()}! 💧", type="positive")

                        # Clear form
                        selected_plant.set_value(None)
                        watering_date.set_value(date.today().isoformat())
                        water_amount.set_value(None)
                        notes_input.set_value("")

                        # Refresh plants needing water section
                        plants_needing_water.refresh()

                    else:
                        ui.notify("Failed to log watering", type="negative")

                except Exception as e:
                    import logging

                    logger = logging.getLogger(__name__)
                    logger.error(f"Error logging watering: {str(e)}")
                    ui.notify(f"Error logging watering: {str(e)}", type="negative")

            ui.button("💧 Log Watering", on_click=submit_watering).classes(
                "w-full px-4 py-3 bg-blue-500 text-white hover:bg-blue-600 font-semibold"
            )


@ui.refreshable
def plants_needing_water():
    """Display plants that need watering."""
    thirsty_plants = PlantService.get_plants_needing_water()

    if not thirsty_plants:
        with ui.card().classes("w-full p-6 bg-green-50 border-l-4 border-green-400 text-center"):
            ui.label("🎉").classes("text-4xl mb-2")
            ui.label("All plants are well-watered!").classes("text-lg font-semibold text-green-700")
            ui.label("Great job taking care of your green friends!").classes("text-green-600")
        return

    ui.label(f"🚨 Plants Needing Water ({len(thirsty_plants)})").classes("text-xl font-bold text-red-600 mb-4")

    with ui.column().classes("gap-3"):
        for plant in thirsty_plants:
            from app.dashboard import get_mood_config

            mood_config = get_mood_config(plant.mood)

            with ui.card().classes(f"p-4 {mood_config['bg_color']} {mood_config['border_color']} border-l-4"):
                with ui.row().classes("w-full items-center justify-between"):
                    with ui.column():
                        ui.label(plant.name).classes("text-lg font-semibold text-gray-800")
                        ui.label(f"{plant.location} • {plant.plant_type.value}").classes("text-sm text-gray-600")

                        if plant.last_watered:
                            days_ago = (date.today() - plant.last_watered).days
                            ui.label(f"Last watered: {days_ago} days ago").classes(
                                f"text-sm {mood_config['text_color']}"
                            )
                        else:
                            ui.label("Never watered").classes(f"text-sm {mood_config['text_color']}")

                    with ui.column().classes("items-center gap-2"):
                        ui.label(mood_config["emoji"]).classes("text-2xl")

                        async def quick_water_plant(plant_id=plant.id, plant_name=plant.name):
                            """Quick water this specific plant."""
                            if plant_id is None:
                                ui.notify("Invalid plant ID", type="negative")
                                return

                            try:
                                watering_data = WateringRecordCreate(
                                    plant_id=plant_id, watered_date=date.today(), notes="Watered from urgent list"
                                )

                                updated_plant = PlantService.water_plant(plant_id, watering_data)
                                if updated_plant:
                                    ui.notify(f"{plant_name} has been watered! 💧", type="positive")
                                    plants_needing_water.refresh()
                                else:
                                    ui.notify("Failed to water plant", type="negative")
                            except Exception as e:
                                import logging

                                logger = logging.getLogger(__name__)
                                logger.error(f"Error watering {plant_name}: {str(e)}")
                                ui.notify(f"Error watering {plant_name}: {str(e)}", type="negative")

                        ui.button("💧 Water Now", on_click=quick_water_plant).classes(
                            "px-3 py-1 bg-blue-500 text-white hover:bg-blue-600 text-sm"
                        )


def create_plants_needing_water_section():
    """Create the section showing plants that need water."""
    with ui.card().classes("w-full max-w-4xl mx-auto p-6"):
        plants_needing_water()


def create():
    """Create the watering tracking page."""

    @ui.page("/water")
    def watering_page():
        ui.colors(primary="#10b981")

        with ui.column().classes("w-full mx-auto p-6"):
            # Header
            with ui.row().classes("w-full items-center justify-between mb-6"):
                with ui.column():
                    ui.label("💧 Plant Watering").classes("text-3xl font-bold text-gray-800 mb-2")
                    ui.label("Keep your plants happy and hydrated").classes("text-lg text-gray-600")

                ui.button("← Back to Dashboard", on_click=lambda: ui.navigate.to("/")).props("outline")

            create_watering_interface()
