"""UI module for managing household members."""

import logging
from nicegui import ui

from app.services import MemberService
from app.models import HouseholdMemberCreate, HouseholdMemberUpdate

logger = logging.getLogger(__name__)


def create():
    """Create the members management UI."""

    @ui.page("/members")
    def members_page():
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
                ui.label("Household Members").classes("text-3xl font-bold text-gray-800")
                ui.button("Add Member", on_click=lambda: add_member_dialog(), color="primary").classes("px-6 py-2")

            # Members list container
            members_container = ui.column().classes("w-full gap-4")

            def refresh_members():
                """Refresh the members list."""
                with members_container:
                    members_container.clear()
                    members = MemberService.get_all_members(active_only=False)

                    if not members:
                        with ui.card().classes("p-8 text-center bg-gray-50"):
                            ui.icon("person_add").classes("text-6xl text-gray-400 mb-4")
                            ui.label("No household members yet").classes("text-xl text-gray-600 mb-2")
                            ui.label("Add your first member to get started").classes("text-gray-500")
                    else:
                        for member in members:
                            create_member_card(member, refresh_members)

            def create_member_card(member, refresh_callback):
                """Create a card for displaying member information."""
                with ui.card().classes("p-6 shadow-lg hover:shadow-xl transition-shadow"):
                    with ui.row().classes("w-full justify-between items-start"):
                        with ui.column().classes("flex-1"):
                            # Member name and status
                            with ui.row().classes("items-center gap-2 mb-2"):
                                ui.label(member.name).classes("text-xl font-bold text-gray-800")
                                if member.is_active:
                                    ui.badge("Active", color="positive").classes("text-xs")
                                else:
                                    ui.badge("Inactive", color="negative").classes("text-xs")

                            # Member details
                            if member.email:
                                with ui.row().classes("items-center gap-2 text-gray-600"):
                                    ui.icon("email").classes("text-sm")
                                    ui.label(member.email).classes("text-sm")

                            with ui.row().classes("items-center gap-2 text-gray-500 text-xs"):
                                ui.icon("calendar_today").classes("text-sm")
                                ui.label(f"Added {member.created_at.strftime('%Y-%m-%d')}")

                        # Action buttons
                        with ui.column().classes("gap-2"):
                            ui.button(
                                "Edit",
                                on_click=lambda m=member: edit_member_dialog(m, refresh_callback),
                                color="secondary",
                            ).props("outline dense")
                            if member.is_active:
                                ui.button(
                                    "Deactivate",
                                    on_click=lambda m=member: deactivate_member(m, refresh_callback),
                                    color="warning",
                                ).props("outline dense")
                            else:
                                ui.button(
                                    "Activate",
                                    on_click=lambda m=member: activate_member(m, refresh_callback),
                                    color="positive",
                                ).props("outline dense")

            async def add_member_dialog():
                """Dialog for adding a new member."""
                with ui.dialog() as dialog, ui.card().classes("w-96 p-6"):
                    ui.label("Add New Member").classes("text-xl font-bold mb-4")

                    name_input = ui.input("Name", placeholder="Enter member name").classes("w-full mb-4")
                    email_input = ui.input("Email (optional)", placeholder="Enter email address").classes("w-full mb-6")

                    with ui.row().classes("w-full justify-end gap-2"):
                        ui.button("Cancel", on_click=lambda: dialog.submit(False)).props("outline")
                        ui.button("Add Member", on_click=lambda: dialog.submit(True), color="primary")

                result = await dialog
                if result:
                    name = name_input.value.strip() if name_input.value else ""
                    email = email_input.value.strip() if email_input.value else None

                    if not name:
                        ui.notify("Member name is required", type="negative")
                        return

                    try:
                        member_data = HouseholdMemberCreate(name=name, email=email)
                        MemberService.create_member(member_data)
                        ui.notify(f'Member "{name}" added successfully!', type="positive")
                        refresh_members()
                    except Exception as e:
                        logger.error(f"Error adding member {name}: {str(e)}")
                        ui.notify(f"Error adding member: {str(e)}", type="negative")

            async def edit_member_dialog(member, refresh_callback):
                """Dialog for editing an existing member."""
                with ui.dialog() as dialog, ui.card().classes("w-96 p-6"):
                    ui.label("Edit Member").classes("text-xl font-bold mb-4")

                    name_input = ui.input("Name", value=member.name).classes("w-full mb-4")
                    email_input = ui.input("Email", value=member.email or "").classes("w-full mb-6")

                    with ui.row().classes("w-full justify-end gap-2"):
                        ui.button("Cancel", on_click=lambda: dialog.submit(False)).props("outline")
                        ui.button("Save Changes", on_click=lambda: dialog.submit(True), color="primary")

                result = await dialog
                if result:
                    name = name_input.value.strip() if name_input.value else ""
                    email = email_input.value.strip() if email_input.value else None

                    if not name:
                        ui.notify("Member name is required", type="negative")
                        return

                    try:
                        if member.id is not None:
                            updates = HouseholdMemberUpdate(name=name, email=email)
                            MemberService.update_member(member.id, updates)
                            ui.notify(f'Member "{name}" updated successfully!', type="positive")
                            refresh_callback()
                    except Exception as e:
                        logger.error(f"Error updating member {member.id}: {str(e)}")
                        ui.notify(f"Error updating member: {str(e)}", type="negative")

            def deactivate_member(member, refresh_callback):
                """Deactivate a member."""
                try:
                    if member.id is not None:
                        MemberService.delete_member(member.id)
                        ui.notify(f'Member "{member.name}" deactivated', type="warning")
                        refresh_callback()
                except Exception as e:
                    logger.error(f"Error deactivating member {member.id}: {str(e)}")
                    ui.notify(f"Error deactivating member: {str(e)}", type="negative")

            def activate_member(member, refresh_callback):
                """Reactivate a member."""
                try:
                    if member.id is not None:
                        updates = HouseholdMemberUpdate(is_active=True)
                        MemberService.update_member(member.id, updates)
                        ui.notify(f'Member "{member.name}" activated', type="positive")
                        refresh_callback()
                except Exception as e:
                    logger.error(f"Error activating member {member.id}: {str(e)}")
                    ui.notify(f"Error activating member: {str(e)}", type="negative")

            # Initial load
            refresh_members()
