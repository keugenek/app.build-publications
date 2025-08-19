from datetime import date
from nicegui import ui
from app.event_service import EventService
from app.models import EventCreate, EventUpdate
import logging

logger = logging.getLogger(__name__)


def apply_modern_theme():
    """Apply modern color scheme for 2025."""
    ui.colors(
        primary="#2563eb",  # Professional blue
        secondary="#64748b",  # Subtle gray
        accent="#10b981",  # Success green
        positive="#10b981",
        negative="#ef4444",  # Error red
        warning="#f59e0b",  # Warning amber
        info="#3b82f6",  # Info blue
    )


class TextStyles:
    """Reusable text styles for consistency."""

    HEADING = "text-3xl font-bold text-gray-800 mb-6"
    SUBHEADING = "text-xl font-semibold text-gray-700 mb-4"
    BODY = "text-base text-gray-600 leading-relaxed"
    CAPTION = "text-sm text-gray-500"


def create():
    """Create the event tracker application."""
    apply_modern_theme()

    @ui.page("/")
    def index():
        create_event_tracker_page()


@ui.refreshable
def events_display():
    """Refreshable events display."""
    try:
        events = EventService.get_all_events()

        if not events:
            with ui.card().classes("w-full p-12 text-center shadow-md rounded-lg"):
                ui.icon("event_busy", size="4rem").classes("text-gray-300 mb-4")
                ui.label("No events yet").classes("text-lg text-gray-500 mb-2")
                ui.label('Click "Add Event" to create your first event').classes("text-gray-400")
        else:
            for event in events:
                create_event_card(event)

    except Exception as e:
        logger.error(f"Error loading events: {e}")
        with ui.card().classes("w-full p-6 text-center shadow-md rounded-lg"):
            ui.icon("error", size="2rem").classes("text-negative mb-2")
            ui.label("Error loading events").classes("text-lg text-negative")


def create_event_tracker_page():
    """Create the main event tracker page with modern UI."""
    # Page header
    with ui.row().classes("w-full justify-between items-center mb-8"):
        ui.label("Event Tracker").classes(TextStyles.HEADING)
        ui.button("Add Event", on_click=show_add_event_dialog).classes(
            "bg-primary text-white px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition-shadow"
        ).props("icon=add")

    # Search and filters
    with ui.card().classes("w-full p-6 mb-6 shadow-lg rounded-lg"):
        with ui.row().classes("gap-4 w-full items-end"):
            search_input = ui.input(label="Search events", placeholder="Search by title or description...").classes(
                "flex-1"
            )
            ui.button("Search", on_click=lambda: perform_search(search_input.value)).classes(
                "bg-secondary text-white px-4 py-2 rounded"
            ).props("icon=search")
            ui.button("Clear", on_click=lambda: clear_search(search_input)).classes(
                "border border-gray-300 text-gray-600 px-4 py-2 rounded hover:bg-gray-50"
            ).props("outline")

    # Events container
    with ui.column().classes("w-full gap-4"):
        events_display()


def show_add_event_dialog():
    """Show dialog for adding a new event."""
    with ui.dialog() as dialog, ui.card().classes("w-96 p-6"):
        ui.label("Add New Event").classes("text-xl font-bold mb-6")

        title_input = ui.input(label="Event Title", placeholder="Enter event title").classes("w-full mb-4")

        ui.label("Event Date").classes("text-sm font-medium text-gray-700 mb-1")
        date_input = ui.date(value=date.today().isoformat()).classes("w-full mb-4")

        description_input = (
            ui.textarea(label="Description", placeholder="Enter event description (optional)")
            .classes("w-full mb-6")
            .props("rows=4")
        )

        # Buttons
        with ui.row().classes("gap-2 justify-end w-full"):
            ui.button("Cancel", on_click=lambda: dialog.close()).classes(
                "border border-gray-300 text-gray-600 px-4 py-2 rounded hover:bg-gray-50"
            ).props("outline")
            ui.button(
                "Add Event", on_click=lambda: add_event_and_close(dialog, title_input, date_input, description_input)
            ).classes("bg-primary text-white px-4 py-2 rounded")

    dialog.open()


def add_event_and_close(dialog, title_input, date_input, description_input):
    """Add event and close dialog."""
    try:
        if not title_input.value or not title_input.value.strip():
            ui.notify("Please enter an event title", type="negative")
            return

        # Convert string date value to date object
        event_date = date.today()
        if date_input.value:
            if isinstance(date_input.value, str):
                from datetime import datetime as dt

                event_date = dt.fromisoformat(date_input.value).date()
            else:
                event_date = date_input.value

        event_data = EventCreate(
            title=title_input.value.strip(),
            event_date=event_date,
            description=description_input.value.strip() if description_input.value else "",
        )

        EventService.create_event(event_data)
        ui.notify("Event added successfully!", type="positive")
        dialog.close()

        # Refresh the events display
        events_display.refresh()

    except Exception as e:
        logger.error(f"Error adding event: {e}")
        ui.notify("Error adding event", type="negative")


def show_edit_event_dialog(event_id: int):
    """Show dialog for editing an existing event."""
    event = EventService.get_event_by_id(event_id)
    if event is None:
        ui.notify("Event not found", type="negative")
        return

    with ui.dialog() as dialog, ui.card().classes("w-96 p-6"):
        ui.label("Edit Event").classes("text-xl font-bold mb-6")

        title_input = ui.input(label="Event Title", value=event.title).classes("w-full mb-4")

        ui.label("Event Date").classes("text-sm font-medium text-gray-700 mb-1")
        date_input = ui.date(value=event.event_date.isoformat()).classes("w-full mb-4")

        description_input = (
            ui.textarea(label="Description", value=event.description).classes("w-full mb-6").props("rows=4")
        )

        # Buttons
        with ui.row().classes("gap-2 justify-end w-full"):
            ui.button("Cancel", on_click=lambda: dialog.close()).classes(
                "border border-gray-300 text-gray-600 px-4 py-2 rounded hover:bg-gray-50"
            ).props("outline")
            ui.button(
                "Save Changes",
                on_click=lambda: update_event_and_close(dialog, event_id, title_input, date_input, description_input),
            ).classes("bg-primary text-white px-4 py-2 rounded")

    dialog.open()


def update_event_and_close(dialog, event_id: int, title_input, date_input, description_input):
    """Update event and close dialog."""
    try:
        if not title_input.value or not title_input.value.strip():
            ui.notify("Please enter an event title", type="negative")
            return

        # Convert string date value to date object
        event_date = date.today()
        if date_input.value:
            if isinstance(date_input.value, str):
                from datetime import datetime as dt

                event_date = dt.fromisoformat(date_input.value).date()
            else:
                event_date = date_input.value

        update_data = EventUpdate(
            title=title_input.value.strip(),
            event_date=event_date,
            description=description_input.value.strip() if description_input.value else "",
        )

        updated_event = EventService.update_event(event_id, update_data)
        if updated_event:
            ui.notify("Event updated successfully!", type="positive")
            dialog.close()
            events_display.refresh()
        else:
            ui.notify("Event not found", type="negative")

    except Exception as e:
        logger.error(f"Error updating event: {e}")
        ui.notify("Error updating event", type="negative")


def confirm_delete_event(event_id: int, event_title: str):
    """Show confirmation dialog for event deletion."""
    with ui.dialog() as dialog, ui.card().classes("w-80 p-6"):
        ui.label("Confirm Deletion").classes("text-lg font-bold mb-4")
        ui.label(f'Are you sure you want to delete "{event_title}"?').classes("mb-6")

        with ui.row().classes("gap-2 justify-end w-full"):
            ui.button("Cancel", on_click=lambda: dialog.close()).classes(
                "border border-gray-300 text-gray-600 px-4 py-2 rounded hover:bg-gray-50"
            ).props("outline")
            ui.button("Delete", on_click=lambda: delete_event_and_close(dialog, event_id)).classes(
                "bg-negative text-white px-4 py-2 rounded"
            )

    dialog.open()


def delete_event_and_close(dialog, event_id: int):
    """Delete event and close dialog."""
    try:
        success = EventService.delete_event(event_id)
        if success:
            ui.notify("Event deleted successfully", type="positive")
            dialog.close()
            events_display.refresh()
        else:
            ui.notify("Event not found", type="negative")
    except Exception as e:
        logger.error(f"Error deleting event: {e}")
        ui.notify("Error deleting event", type="negative")


def create_event_card(event):
    """Create a modern card for displaying an event."""
    with ui.card().classes("w-full p-6 shadow-md hover:shadow-lg transition-shadow rounded-lg"):
        # Event header
        with ui.row().classes("justify-between items-start w-full mb-4"):
            with ui.column().classes("flex-1"):
                ui.label(event.title).classes("text-xl font-bold text-gray-800")
                ui.label(f"📅 {event.event_date.strftime('%B %d, %Y')}").classes("text-sm text-primary font-medium")

            # Action buttons
            with ui.row().classes("gap-2"):
                if event.id is not None:
                    ui.button("Edit", on_click=lambda _, event_id=event.id: show_edit_event_dialog(event_id)).classes(
                        "text-xs bg-secondary text-white px-3 py-1 rounded"
                    ).props("icon=edit size=sm")
                    ui.button(
                        "Delete",
                        on_click=lambda _, event_id=event.id, title=event.title: confirm_delete_event(event_id, title),
                    ).classes("text-xs bg-negative text-white px-3 py-1 rounded").props("icon=delete size=sm")

        # Event description
        if event.description:
            ui.label(event.description).classes("text-gray-600 leading-relaxed")
        else:
            ui.label("No description provided").classes("text-gray-400 italic")

        # Event metadata
        with ui.row().classes("justify-between items-center mt-4 pt-4 border-t border-gray-200"):
            ui.label(f"Created: {event.created_at.strftime('%m/%d/%Y at %I:%M %p')}").classes(TextStyles.CAPTION)
            if event.updated_at != event.created_at:
                ui.label(f"Updated: {event.updated_at.strftime('%m/%d/%Y at %I:%M %p')}").classes(TextStyles.CAPTION)


def perform_search(query: str):
    """Perform search and refresh display."""
    # For now, just refresh - search functionality can be expanded later
    ui.notify(f"Search functionality coming soon! Query: {query}", type="info")


def clear_search(search_input):
    """Clear search and refresh display."""
    search_input.set_value("")
    ui.notify("Search cleared", type="info")
