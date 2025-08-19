"""UI module for managing chores."""

import logging
from nicegui import ui

from app.services import ChoreService
from app.models import ChoreCreate, ChoreUpdate

logger = logging.getLogger(__name__)


def create():
    """Create the chores management UI."""

    @ui.page("/chores")
    def chores_page():
        ui.colors(
            primary="#2563eb",
            secondary="#64748b",
            accent="#10b981",
            positive="#10b981",
            negative="#ef4444",
            warning="#f59e0b",
            info="#3b82f6",
        )

        # Navigation bar
        with ui.header().classes("bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"):
            with ui.row().classes("w-full max-w-7xl mx-auto px-6 py-3 justify-between items-center"):
                ui.label("🏠 ChoreManager").classes("text-2xl font-bold")
                with ui.row().classes("gap-4"):
                    ui.link("Dashboard", "/").classes("text-white hover:text-blue-200 font-medium")
                    ui.link("Members", "/members").classes("text-white hover:text-blue-200 font-medium")
                    ui.link("Chores", "/chores").classes("text-white hover:text-blue-200 font-medium")
                    ui.link("History", "/history").classes("text-white hover:text-blue-200 font-medium")

        with ui.column().classes("w-full max-w-6xl mx-auto p-6 gap-6"):
            # Header
            with ui.row().classes("w-full justify-between items-center mb-4"):
                ui.label("Household Chores").classes("text-3xl font-bold text-gray-800")
                ui.button("Add Chore", on_click=lambda: add_chore_dialog(), color="primary").classes("px-6 py-2")

            # Chores list container
            chores_container = ui.column().classes("w-full gap-4")

            def refresh_chores():
                """Refresh the chores list."""
                with chores_container:
                    chores_container.clear()
                    chores = ChoreService.get_all_chores(active_only=False)

                    if not chores:
                        with ui.card().classes("p-8 text-center bg-gray-50"):
                            ui.icon("cleaning_services").classes("text-6xl text-gray-400 mb-4")
                            ui.label("No chores defined yet").classes("text-xl text-gray-600 mb-2")
                            ui.label("Add your first chore to get started").classes("text-gray-500")
                    else:
                        for chore in chores:
                            create_chore_card(chore, refresh_chores)

            def create_chore_card(chore, refresh_callback):
                """Create a card for displaying chore information."""
                with ui.card().classes("p-6 shadow-lg hover:shadow-xl transition-shadow"):
                    with ui.row().classes("w-full justify-between items-start"):
                        with ui.column().classes("flex-1"):
                            # Chore name and status
                            with ui.row().classes("items-center gap-2 mb-2"):
                                ui.label(chore.name).classes("text-xl font-bold text-gray-800")
                                if chore.is_active:
                                    ui.badge("Active", color="positive").classes("text-xs")
                                else:
                                    ui.badge("Inactive", color="negative").classes("text-xs")

                            # Chore description
                            if chore.description:
                                ui.label(chore.description).classes("text-gray-600 mb-3 leading-relaxed")

                            # Chore details
                            with ui.row().classes("gap-6 text-sm text-gray-500"):
                                if chore.estimated_minutes:
                                    with ui.row().classes("items-center gap-1"):
                                        ui.icon("schedule").classes("text-sm")
                                        ui.label(f"{chore.estimated_minutes} min")

                                with ui.row().classes("items-center gap-1"):
                                    ui.icon("signal_cellular_alt").classes("text-sm")
                                    difficulty_text = ["", "Easy", "Medium", "Hard", "Very Hard", "Extreme"][
                                        chore.difficulty_level
                                    ]
                                    ui.label(f"Difficulty: {difficulty_text}")

                        # Action buttons
                        with ui.column().classes("gap-2"):
                            ui.button(
                                "Edit",
                                on_click=lambda c=chore: edit_chore_dialog(c, refresh_callback),
                                color="secondary",
                            ).props("outline dense")
                            if chore.is_active:
                                ui.button(
                                    "Deactivate",
                                    on_click=lambda c=chore: deactivate_chore(c, refresh_callback),
                                    color="warning",
                                ).props("outline dense")
                            else:
                                ui.button(
                                    "Activate",
                                    on_click=lambda c=chore: activate_chore(c, refresh_callback),
                                    color="positive",
                                ).props("outline dense")

            async def add_chore_dialog():
                """Dialog for adding a new chore."""
                with ui.dialog() as dialog, ui.card().classes("w-96 p-6"):
                    ui.label("Add New Chore").classes("text-xl font-bold mb-4")

                    name_input = ui.input("Chore Name", placeholder="e.g., Vacuum living room").classes("w-full mb-4")
                    description_input = (
                        ui.textarea("Description (optional)", placeholder="Additional details about this chore")
                        .classes("w-full mb-4")
                        .props("rows=3")
                    )

                    with ui.row().classes("w-full gap-4 mb-4"):
                        minutes_input = ui.number("Estimated Minutes", value=30, min=1, max=480).classes("flex-1")
                        difficulty_input = ui.select(
                            options={1: "Easy", 2: "Medium", 3: "Hard", 4: "Very Hard", 5: "Extreme"},
                            value=1,
                            label="Difficulty",
                        ).classes("flex-1")

                    with ui.row().classes("w-full justify-end gap-2"):
                        ui.button("Cancel", on_click=lambda: dialog.submit(False)).props("outline")
                        ui.button("Add Chore", on_click=lambda: dialog.submit(True), color="primary")

                result = await dialog
                if result:
                    name = name_input.value.strip() if name_input.value else ""
                    description = description_input.value.strip() if description_input.value else ""
                    minutes = int(minutes_input.value) if minutes_input.value else None
                    difficulty = int(difficulty_input.value) if difficulty_input.value else 1

                    if not name:
                        ui.notify("Chore name is required", type="negative")
                        return

                    try:
                        chore_data = ChoreCreate(
                            name=name, description=description, estimated_minutes=minutes, difficulty_level=difficulty
                        )
                        ChoreService.create_chore(chore_data)
                        ui.notify(f'Chore "{name}" added successfully!', type="positive")
                        refresh_chores()
                    except Exception as e:
                        logger.error(f"Error adding chore {name}: {str(e)}")
                        ui.notify(f"Error adding chore: {str(e)}", type="negative")

            async def edit_chore_dialog(chore, refresh_callback):
                """Dialog for editing an existing chore."""
                with ui.dialog() as dialog, ui.card().classes("w-96 p-6"):
                    ui.label("Edit Chore").classes("text-xl font-bold mb-4")

                    name_input = ui.input("Chore Name", value=chore.name).classes("w-full mb-4")
                    description_input = (
                        ui.textarea("Description", value=chore.description).classes("w-full mb-4").props("rows=3")
                    )

                    with ui.row().classes("w-full gap-4 mb-4"):
                        minutes_input = ui.number(
                            "Estimated Minutes", value=chore.estimated_minutes or 30, min=1, max=480
                        ).classes("flex-1")
                        difficulty_input = ui.select(
                            options={1: "Easy", 2: "Medium", 3: "Hard", 4: "Very Hard", 5: "Extreme"},
                            value=chore.difficulty_level,
                            label="Difficulty",
                        ).classes("flex-1")

                    with ui.row().classes("w-full justify-end gap-2"):
                        ui.button("Cancel", on_click=lambda: dialog.submit(False)).props("outline")
                        ui.button("Save Changes", on_click=lambda: dialog.submit(True), color="primary")

                result = await dialog
                if result:
                    name = name_input.value.strip() if name_input.value else ""
                    description = description_input.value.strip() if description_input.value else ""
                    minutes = int(minutes_input.value) if minutes_input.value else None
                    difficulty = int(difficulty_input.value) if difficulty_input.value else 1

                    if not name:
                        ui.notify("Chore name is required", type="negative")
                        return

                    try:
                        if chore.id is not None:
                            updates = ChoreUpdate(
                                name=name,
                                description=description,
                                estimated_minutes=minutes,
                                difficulty_level=difficulty,
                            )
                            ChoreService.update_chore(chore.id, updates)
                            ui.notify(f'Chore "{name}" updated successfully!', type="positive")
                            refresh_callback()
                    except Exception as e:
                        logger.error(f"Error updating chore {chore.id}: {str(e)}")
                        ui.notify(f"Error updating chore: {str(e)}", type="negative")

            def deactivate_chore(chore, refresh_callback):
                """Deactivate a chore."""
                try:
                    if chore.id is not None:
                        ChoreService.delete_chore(chore.id)
                        ui.notify(f'Chore "{chore.name}" deactivated', type="warning")
                        refresh_callback()
                except Exception as e:
                    logger.error(f"Error deactivating chore {chore.id}: {str(e)}")
                    ui.notify(f"Error deactivating chore: {str(e)}", type="negative")

            def activate_chore(chore, refresh_callback):
                """Reactivate a chore."""
                try:
                    if chore.id is not None:
                        updates = ChoreUpdate(is_active=True)
                        ChoreService.update_chore(chore.id, updates)
                        ui.notify(f'Chore "{chore.name}" activated', type="positive")
                        refresh_callback()
                except Exception as e:
                    logger.error(f"Error activating chore {chore.id}: {str(e)}")
                    ui.notify(f"Error activating chore: {str(e)}", type="negative")

            # Initial load
            refresh_chores()
