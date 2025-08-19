from nicegui import ui
from typing import Optional
import logging
from app.book_service import BookService
from app.models import BookCreate, BookUpdate, BookSearch, ReadingStatus, BookRead

logger = logging.getLogger(__name__)


def create():
    """Create the book library application."""

    # Apply modern color scheme
    ui.colors(
        primary="#2563eb",  # Professional blue
        secondary="#64748b",  # Subtle gray
        accent="#10b981",  # Success green
        positive="#10b981",
        negative="#ef4444",  # Error red
        warning="#f59e0b",  # Warning amber
        info="#3b82f6",  # Info blue
    )

    @ui.page("/")
    @ui.page("/library")
    def library_page():
        """Main library page with modern design."""

        # State variables
        current_books: list[BookRead] = []
        search_query = ""
        filter_genre = ""
        filter_status = ""

        def load_books():
            """Load books based on current search and filter criteria."""
            nonlocal current_books
            try:
                search_params = None
                if search_query or filter_genre or filter_status:
                    reading_status_param: Optional[ReadingStatus] = None
                    if filter_status and filter_status in [s.value for s in ReadingStatus]:
                        reading_status_param = ReadingStatus(filter_status)

                    # Build search parameters with proper type handling
                    search_params = BookSearch(
                        query=search_query or None, genre=filter_genre or None, reading_status=reading_status_param
                    )

                current_books = BookService.search_books(search_params)
                render_books_display.refresh()

            except Exception as e:
                logger.error(f"Error loading books: {e}")
                ui.notify(f"Error loading books: {str(e)}", type="negative")

        @ui.refreshable
        def render_stats():
            """Render statistics cards."""
            try:
                stats = BookService.get_book_count_by_status()
                total_books = sum(stats.values())

                with ui.row().classes("w-full gap-4 mb-6"):
                    # Total Books Card
                    with ui.card().classes("p-6 bg-white shadow-lg rounded-xl flex-1"):
                        ui.label("Total Books").classes("text-sm text-gray-500 uppercase")
                        ui.label(str(total_books)).classes("text-3xl font-bold text-gray-800 mt-2")

                    # Status Cards
                    status_info = [
                        (ReadingStatus.READ, "Completed", "bg-green-50 text-green-600"),
                        (ReadingStatus.READING, "Currently Reading", "bg-blue-50 text-blue-600"),
                        (ReadingStatus.WANT_TO_READ, "Want to Read", "bg-amber-50 text-amber-600"),
                    ]

                    for status, label, color_class in status_info:
                        with ui.card().classes(f"p-4 {color_class} flex-1"):
                            ui.label(label).classes("text-xs uppercase")
                            ui.label(str(stats.get(status, 0))).classes("text-2xl font-bold mt-1")

            except Exception as e:
                logger.error(f"Error loading statistics: {e}")
                ui.notify(f"Error loading statistics: {str(e)}", type="negative")

        @ui.refreshable
        def render_search_filters():
            """Render search and filter controls."""
            nonlocal search_query, filter_genre, filter_status

            with ui.card().classes("p-4 mb-6"):
                with ui.row().classes("w-full gap-4"):
                    # Search input
                    def update_search(value):
                        nonlocal search_query
                        search_query = value
                        load_books()

                    ui.input(
                        label="Search books",
                        placeholder="Search by title or author...",
                        value=search_query,
                        on_change=lambda e: update_search(e.value),
                    ).classes("flex-1")

                    # Genre filter
                    try:
                        genres = [""] + BookService.get_genres()
                        genre_options = {g: g if g else "All Genres" for g in genres}

                        def update_genre(value):
                            nonlocal filter_genre
                            filter_genre = value or ""
                            load_books()

                        ui.select(
                            options=genre_options,
                            label="Genre",
                            value=filter_genre,
                            on_change=lambda e: update_genre(e.value),
                        ).classes("w-48")
                    except Exception as e:
                        logger.error(f"Error loading genres: {e}")

                    # Status filter
                    status_options = {
                        "": "All Status",
                        ReadingStatus.READ.value: "Read",
                        ReadingStatus.READING.value: "Reading",
                        ReadingStatus.WANT_TO_READ.value: "Want to Read",
                    }

                    def update_status(value):
                        nonlocal filter_status
                        filter_status = value or ""
                        load_books()

                    ui.select(
                        options=status_options,
                        label="Reading Status",
                        value=filter_status,
                        on_change=lambda e: update_status(e.value),
                    ).classes("w-48")

                    # Clear filters
                    def clear_filters():
                        nonlocal search_query, filter_genre, filter_status
                        search_query = ""
                        filter_genre = ""
                        filter_status = ""
                        render_search_filters.refresh()
                        load_books()

                    ui.button("Clear Filters", on_click=clear_filters).props("outline")

        @ui.refreshable
        def render_books_display():
            """Render the books display."""
            if not current_books:
                with ui.card().classes("p-8 text-center bg-gray-50"):
                    ui.icon("menu_book", size="4rem").classes("text-gray-300 mb-4")
                    ui.label("No books found").classes("text-xl text-gray-500 mb-2")
                    ui.label("Add your first book or adjust your search filters").classes("text-gray-400")
                    ui.button("Add Your First Book", on_click=lambda: show_add_dialog()).classes(
                        "mt-4 bg-primary text-white px-6 py-2"
                    )
                return

            # Display books as cards
            for book in current_books:
                with ui.card().classes("p-4 mb-4 shadow-md hover:shadow-lg transition-shadow"):
                    with ui.row().classes("w-full items-center justify-between"):
                        with ui.column().classes("flex-1"):
                            ui.label(book.title).classes("text-lg font-semibold text-gray-800")
                            ui.label(f"by {book.author}").classes("text-gray-600")
                            with ui.row().classes("gap-4 mt-2"):
                                ui.chip(book.genre).props("outline size=sm")

                                status_colors = {
                                    ReadingStatus.READ: "positive",
                                    ReadingStatus.READING: "info",
                                    ReadingStatus.WANT_TO_READ: "warning",
                                }
                                status_text = {
                                    ReadingStatus.READ: "Read",
                                    ReadingStatus.READING: "Reading",
                                    ReadingStatus.WANT_TO_READ: "Want to Read",
                                }
                                ui.chip(status_text[book.reading_status]).props(
                                    f"color={status_colors[book.reading_status]} size=sm"
                                )

                        with ui.row().classes("gap-2"):
                            # Capture book in closure properly
                            def make_edit_handler(book_to_edit):
                                return lambda: show_edit_dialog(book_to_edit)

                            def make_delete_handler(book_to_delete):
                                return lambda: show_delete_dialog(book_to_delete)

                            ui.button(icon="edit", on_click=make_edit_handler(book)).props("flat size=sm color=primary")

                            ui.button(icon="delete", on_click=make_delete_handler(book)).props(
                                "flat size=sm color=negative"
                            )

        async def show_add_dialog():
            """Show dialog for adding a new book."""
            with ui.dialog() as dialog, ui.card().classes("w-96"):
                ui.label("Add New Book").classes("text-xl font-bold mb-4")

                title_input = ui.input("Title").classes("w-full mb-2")
                author_input = ui.input("Author").classes("w-full mb-2")
                genre_input = ui.input("Genre").classes("w-full mb-2")

                status_options = {
                    ReadingStatus.WANT_TO_READ: "Want to Read",
                    ReadingStatus.READING: "Currently Reading",
                    ReadingStatus.READ: "Completed",
                }
                status_select = ui.select(
                    options=status_options, label="Reading Status", value=ReadingStatus.WANT_TO_READ
                ).classes("w-full mb-4")

                with ui.row().classes("gap-2 justify-end w-full"):
                    ui.button("Cancel", on_click=lambda: dialog.submit(None))
                    ui.button("Add Book", on_click=lambda: dialog.submit("save")).classes("bg-primary text-white")

            result = await dialog

            if result == "save":
                if not title_input.value or not author_input.value or not genre_input.value:
                    ui.notify("Please fill in all required fields", type="warning")
                    return

                try:
                    book_data = BookCreate(
                        title=title_input.value.strip(),
                        author=author_input.value.strip(),
                        genre=genre_input.value.strip(),
                        reading_status=ReadingStatus(status_select.value),
                    )

                    BookService.create_book(book_data)
                    ui.notify(f'Successfully added "{book_data.title}"', type="positive")

                    load_books()
                    render_stats.refresh()

                except Exception as e:
                    logger.error(f"Error adding book: {e}")
                    ui.notify(f"Error adding book: {str(e)}", type="negative")

        async def show_edit_dialog(book: BookRead):
            """Show dialog for editing an existing book."""
            with ui.dialog() as dialog, ui.card().classes("w-96"):
                ui.label(f'Edit "{book.title}"').classes("text-xl font-bold mb-4")

                title_input = ui.input("Title", value=book.title).classes("w-full mb-2")
                author_input = ui.input("Author", value=book.author).classes("w-full mb-2")
                genre_input = ui.input("Genre", value=book.genre).classes("w-full mb-2")

                status_options = {
                    ReadingStatus.WANT_TO_READ: "Want to Read",
                    ReadingStatus.READING: "Currently Reading",
                    ReadingStatus.READ: "Completed",
                }
                status_select = ui.select(
                    options=status_options, label="Reading Status", value=book.reading_status
                ).classes("w-full mb-4")

                with ui.row().classes("gap-2 justify-end w-full"):
                    ui.button("Cancel", on_click=lambda: dialog.submit(None))
                    ui.button("Save Changes", on_click=lambda: dialog.submit("save")).classes("bg-primary text-white")

            result = await dialog

            if result == "save":
                try:
                    book_data = BookUpdate(
                        title=title_input.value.strip() if title_input.value.strip() != book.title else None,
                        author=author_input.value.strip() if author_input.value.strip() != book.author else None,
                        genre=genre_input.value.strip() if genre_input.value.strip() != book.genre else None,
                        reading_status=status_select.value if status_select.value != book.reading_status else None,
                    )

                    updated_book = BookService.update_book(book.id, book_data)
                    if updated_book:
                        ui.notify(f'Successfully updated "{updated_book.title}"', type="positive")
                        load_books()
                        render_stats.refresh()
                    else:
                        ui.notify("Book not found", type="negative")

                except Exception as e:
                    logger.error(f"Error updating book: {e}")
                    ui.notify(f"Error updating book: {str(e)}", type="negative")

        async def show_delete_dialog(book: BookRead):
            """Show confirmation dialog for deleting a book."""
            with ui.dialog() as dialog, ui.card().classes("w-80"):
                ui.label("Confirm Deletion").classes("text-xl font-bold mb-4 text-red-600")
                ui.label(f'Are you sure you want to delete "{book.title}" by {book.author}?').classes("mb-4")
                ui.label("This action cannot be undone.").classes("text-sm text-gray-500 mb-4")

                with ui.row().classes("gap-2 justify-end w-full"):
                    ui.button("Cancel", on_click=lambda: dialog.submit(None))
                    ui.button("Delete", on_click=lambda: dialog.submit("delete")).classes("bg-red-500 text-white")

            result = await dialog

            if result == "delete":
                try:
                    success = BookService.delete_book(book.id)
                    if success:
                        ui.notify(f'Successfully deleted "{book.title}"', type="positive")
                        load_books()
                        render_stats.refresh()
                    else:
                        ui.notify("Book not found", type="negative")

                except Exception as e:
                    logger.error(f"Error deleting book: {e}")
                    ui.notify(f"Error deleting book: {str(e)}", type="negative")

        # Build the page layout
        with ui.row().classes("w-full items-center justify-between mb-6"):
            with ui.column():
                ui.label("📚 Book Library").classes("text-3xl font-bold text-gray-800")
                ui.label("Manage your personal book collection").classes("text-gray-600")

            ui.button("Add New Book", icon="add", on_click=lambda: show_add_dialog()).classes(
                "bg-primary text-white px-6 py-3 shadow-lg"
            )

        # Statistics cards
        render_stats()

        # Search and filters
        render_search_filters()

        # Books display
        render_books_display()

        # Initial data load
        load_books()
