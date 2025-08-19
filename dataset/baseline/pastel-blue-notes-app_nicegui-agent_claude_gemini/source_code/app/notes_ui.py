from nicegui import ui
from typing import List
from datetime import datetime
from app.notes_service import NotesService
from app.models import Note, NoteCreate, NoteUpdate, Category
from app.theme import ThemeStyles


def create_note_dialog(user_id: int, categories: List[Category], on_success=None):
    """Create a dialog for adding new notes"""

    with ui.dialog() as dialog, ui.card().classes("w-[600px] p-6"):
        ui.label("New Note").classes(ThemeStyles.SUBHEADING)

        title_input = ui.input("Title", placeholder="Enter note title...").classes(ThemeStyles.INPUT)

        # Category selection
        category_options = [{"label": "Uncategorized", "value": None}] + [
            {"label": cat.name, "value": cat.id} for cat in categories
        ]
        category_select = ui.select(options=category_options, label="Category", value=None).classes(ThemeStyles.INPUT)

        content_input = (
            ui.textarea("Content", placeholder="Write your note here...").classes(ThemeStyles.TEXTAREA).props("rows=8")
        )

        async def save_note():
            if not title_input.value:
                ui.notify("Please enter a note title", type="negative")
                return

            try:
                note_data = NoteCreate(
                    title=title_input.value, content=content_input.value or "", category_id=category_select.value
                )

                note = NotesService.create_note(user_id, note_data)
                if note:
                    ui.notify(f'Note "{note.title}" created!', type="positive")
                    dialog.submit(True)
                    if on_success:
                        on_success()
                else:
                    ui.notify("Failed to create note", type="negative")
            except Exception:
                ui.notify("Error creating note", type="negative")

        with ui.row().classes("w-full justify-end gap-2 mt-6"):
            ui.button("Cancel", on_click=lambda: dialog.submit(False)).classes(ThemeStyles.OUTLINE_BUTTON)
            ui.button("Save", on_click=save_note).classes(ThemeStyles.PRIMARY_BUTTON)

    return dialog


def create_edit_note_dialog(user_id: int, note: Note, categories: List[Category], on_success=None):
    """Create a dialog for editing existing notes"""

    with ui.dialog() as dialog, ui.card().classes("w-[600px] p-6"):
        ui.label("Edit Note").classes(ThemeStyles.SUBHEADING)

        title_input = ui.input("Title", value=note.title).classes(ThemeStyles.INPUT)

        # Category selection
        category_options = [{"label": "Uncategorized", "value": None}] + [
            {"label": cat.name, "value": cat.id} for cat in categories
        ]
        category_select = ui.select(options=category_options, label="Category", value=note.category_id).classes(
            ThemeStyles.INPUT
        )

        content_input = ui.textarea("Content", value=note.content).classes(ThemeStyles.TEXTAREA).props("rows=8")

        # Pin toggle
        pin_checkbox = ui.checkbox("Pin this note", value=note.is_pinned).classes("mb-4")

        async def save_note():
            if not title_input.value:
                ui.notify("Please enter a note title", type="negative")
                return

            try:
                update_data = NoteUpdate(
                    title=title_input.value,
                    content=content_input.value or "",
                    category_id=category_select.value,
                    is_pinned=pin_checkbox.value,
                )

                if note.id is not None:
                    updated_note = NotesService.update_note(note.id, user_id, update_data)
                    if updated_note:
                        ui.notify(f'Note "{updated_note.title}" updated!', type="positive")
                        dialog.submit(True)
                        if on_success:
                            on_success()
                    else:
                        ui.notify("Failed to update note", type="negative")
                else:
                    ui.notify("Invalid note", type="negative")
            except Exception:
                ui.notify("Error updating note", type="negative")

        async def delete_note():
            with ui.dialog() as confirm_dialog, ui.card():
                ui.label("Delete Note?").classes("text-lg font-semibold mb-4")
                ui.label("This action cannot be undone.").classes("text-gray-600 mb-4")

                with ui.row().classes("gap-2 justify-end"):
                    ui.button("Cancel", on_click=lambda: confirm_dialog.submit(False)).classes(
                        ThemeStyles.OUTLINE_BUTTON
                    )
                    ui.button("Delete", on_click=lambda: confirm_dialog.submit(True)).classes(
                        "bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
                    )

            result = await confirm_dialog
            if result and note.id is not None:
                success = NotesService.delete_note(note.id, user_id)
                if success:
                    ui.notify(f'Note "{note.title}" deleted', type="info")
                    dialog.submit(True)
                    if on_success:
                        on_success()
                else:
                    ui.notify("Failed to delete note", type="negative")

        with ui.row().classes("w-full justify-between mt-6"):
            ui.button("Delete", on_click=delete_note).classes(
                "bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
            )

            with ui.row().classes("gap-2"):
                ui.button("Cancel", on_click=lambda: dialog.submit(False)).classes(ThemeStyles.OUTLINE_BUTTON)
                ui.button("Save", on_click=save_note).classes(ThemeStyles.PRIMARY_BUTTON)

    return dialog


def format_date(dt: datetime) -> str:
    """Format datetime for display"""
    now = datetime.now()
    diff = now - dt

    if diff.days == 0:
        if diff.seconds < 3600:  # Less than 1 hour
            minutes = max(1, diff.seconds // 60)
            return f"{minutes} min ago"
        else:  # Same day
            hours = diff.seconds // 3600
            return f"{hours} hour{'s' if hours != 1 else ''} ago"
    elif diff.days == 1:
        return "Yesterday"
    elif diff.days < 7:
        return f"{diff.days} days ago"
    else:
        return dt.strftime("%b %d, %Y")


def create_note_card(user_id: int, note: Note, categories: List[Category], on_refresh=None):
    """Create a note card component"""

    # Find category info
    category = None
    if note.category_id:
        category = next((cat for cat in categories if cat.id == note.category_id), None)

    def create_edit_handler():
        async def edit_note():
            dialog = create_edit_note_dialog(user_id, note, categories, on_success=on_refresh)
            await dialog

        return edit_note

    with ui.card().classes(ThemeStyles.NOTE_CARD).on("click", create_edit_handler()):
        # Header with title and pin indicator
        with ui.row().classes("w-full items-start justify-between mb-2"):
            title_container = ui.column().classes("flex-1 min-w-0")
            with title_container:
                note_title = note.title if note.title else "Untitled"
                ui.label(note_title).classes("text-lg font-semibold text-gray-800 truncate")

                # Pin indicator and category
                with ui.row().classes("items-center gap-2 mt-1"):
                    if note.is_pinned:
                        ui.label("📌 Pinned").classes(ThemeStyles.PINNED)

                    if category:
                        ui.element("div").classes("w-3 h-3 rounded-full").style(f"background-color: {category.color}")
                        ui.label(category.name).classes("text-xs text-gray-600")

        # Content preview
        if note.content:
            content_preview = note.content[:150] + ("..." if len(note.content) > 150 else "")
            ui.label(content_preview).classes("text-gray-600 text-sm mb-3 leading-relaxed")

        # Footer with date
        ui.label(f"Updated {format_date(note.updated_at)}").classes("text-xs text-gray-400")


def create_notes_grid(user_id: int, notes: List[Note], categories: List[Category], on_refresh=None):
    """Create a grid layout of note cards"""

    if not notes:
        with ui.column().classes("w-full items-center justify-center py-12"):
            ui.icon("note_add", size="64px").classes("text-gray-300 mb-4")
            ui.label("No notes yet").classes("text-xl text-gray-500 mb-2")
            ui.label("Create your first note to get started").classes("text-gray-400")
        return

    # Separate pinned and regular notes
    pinned_notes = [note for note in notes if note.is_pinned]
    regular_notes = [note for note in notes if not note.is_pinned]

    with ui.column().classes("w-full gap-6"):
        # Pinned notes section
        if pinned_notes:
            ui.label("📌 Pinned Notes").classes("text-lg font-semibold text-gray-700 mb-2")
            with ui.row().classes("w-full gap-4 flex-wrap"):
                for note in pinned_notes:
                    with ui.column().classes("w-80"):
                        create_note_card(user_id, note, categories, on_refresh)

        # Regular notes section
        if regular_notes:
            if pinned_notes:  # Add spacing if we have pinned notes above
                ui.separator().classes("my-4")

            with ui.row().classes("w-full gap-4 flex-wrap"):
                for note in regular_notes:
                    with ui.column().classes("w-80"):
                        create_note_card(user_id, note, categories, on_refresh)


def create_notes_search(on_search=None):
    """Create a search bar for notes"""

    search_input = (
        ui.input("Search notes...", placeholder="Search by title or content")
        .classes(ThemeStyles.INPUT + " flex-1")
        .props("outlined clearable")
    )

    def handle_search():
        if on_search:
            on_search(search_input.value or "")

    search_input.on("input", handle_search)

    return search_input
