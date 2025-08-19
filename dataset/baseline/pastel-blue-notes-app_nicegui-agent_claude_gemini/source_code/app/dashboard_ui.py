from nicegui import ui, app
from app.auth_ui import require_auth, logout_user
from app.auth_service import AuthService
from app.category_service import CategoryService
from app.notes_service import NotesService
from app.categories_ui import create_category_list
from app.notes_ui import create_note_dialog, create_notes_grid, create_notes_search
from app.theme import ThemeStyles, apply_pastel_blue_theme


def create():
    """Create the main dashboard UI"""

    @ui.page("/dashboard")
    def dashboard_page():
        # Check authentication
        user_id = require_auth()
        if not user_id:
            return

        ui.add_head_html("<title>Notes App - Dashboard</title>")
        apply_pastel_blue_theme()

        # Get user info
        user = AuthService.get_user_by_id(user_id)
        if not user:
            ui.navigate.to("/login")
            return

        # State variables
        state = {"selected_category_id": None, "search_term": "", "categories": [], "notes": []}

        def load_data():
            """Load categories and notes"""
            state["categories"] = CategoryService.get_user_categories(user_id)

            if state["search_term"]:
                state["notes"] = NotesService.search_notes(user_id, state["search_term"])
            elif state["selected_category_id"] == -1:  # Uncategorized
                state["notes"] = NotesService.get_uncategorized_notes(user_id)
            elif state["selected_category_id"] is not None:
                state["notes"] = NotesService.get_user_notes(user_id, state["selected_category_id"])
            else:
                state["notes"] = NotesService.get_user_notes(user_id)

        # Load initial data
        load_data()

        # Main layout
        with ui.row().classes("w-full min-h-screen"):
            # Sidebar
            with ui.column().classes(ThemeStyles.SIDEBAR):
                # User info and logout
                with ui.row().classes("w-full items-center justify-between mb-6"):
                    with ui.column():
                        ui.label("Notes App").classes("text-xl font-bold text-blue-800")
                        ui.label(user.email).classes("text-sm text-blue-600")

                    ui.button(icon="logout", on_click=logout_user).props("flat round").classes("text-blue-600").tooltip(
                        "Logout"
                    )

                # Category list container
                categories_container = ui.column().classes("w-full")

                def refresh_categories():
                    load_data()
                    update_sidebar()
                    update_main_content()

                def handle_category_select(category_id):
                    state["selected_category_id"] = category_id
                    state["search_term"] = ""  # Clear search when selecting category
                    load_data()
                    update_sidebar()
                    update_main_content()

                def update_sidebar():
                    categories_container.clear()
                    with categories_container:
                        create_category_list(
                            user_id=user_id,
                            categories=state["categories"],
                            selected_category_id=state["selected_category_id"],
                            on_category_select=handle_category_select,
                            on_refresh=refresh_categories,
                        )

                update_sidebar()

            # Main content area
            with ui.column().classes(ThemeStyles.MAIN_CONTENT):
                # Header with search and add note button
                with ui.row().classes("w-full items-center gap-4 mb-6"):
                    # Search bar
                    def handle_search(search_term):
                        state["search_term"] = search_term
                        state["selected_category_id"] = None  # Clear category selection when searching
                        load_data()
                        update_sidebar()
                        update_main_content()

                    create_notes_search(on_search=handle_search)

                    # Add note button
                    async def add_note():
                        dialog = create_note_dialog(user_id, state["categories"], on_success=refresh_notes)
                        await dialog

                    ui.button("New Note", icon="add", on_click=add_note).classes(ThemeStyles.PRIMARY_BUTTON)

                # Content header
                header_container = ui.row().classes("w-full items-center mb-4")

                # Notes container
                notes_container = ui.column().classes("w-full")

                def refresh_notes():
                    load_data()
                    update_main_content()

                def update_main_content():
                    # Update header
                    header_container.clear()
                    with header_container:
                        if state["search_term"]:
                            ui.label(f'Search results for "{state["search_term"]}"').classes(ThemeStyles.HEADING)
                        elif state["selected_category_id"] == -1:
                            ui.label("Uncategorized Notes").classes(ThemeStyles.HEADING)
                        elif state["selected_category_id"] is not None:
                            category = next(
                                (cat for cat in state["categories"] if cat.id == state["selected_category_id"]), None
                            )
                            if category:
                                with ui.row().classes("items-center gap-3"):
                                    ui.element("div").classes("w-6 h-6 rounded-full").style(
                                        f"background-color: {category.color}"
                                    )
                                    ui.label(category.name).classes(ThemeStyles.HEADING)
                        else:
                            ui.label("All Notes").classes(ThemeStyles.HEADING)

                        # Notes count
                        count_text = f"{len(state['notes'])} note{'s' if len(state['notes']) != 1 else ''}"
                        ui.label(count_text).classes("text-gray-500 ml-auto")

                    # Update notes grid
                    notes_container.clear()
                    with notes_container:
                        create_notes_grid(user_id, state["notes"], state["categories"], on_refresh=refresh_notes)

                update_main_content()

    # Redirect root to dashboard or login
    @ui.page("/")
    def index():
        user_id = app.storage.user.get("user_id")
        if user_id:
            ui.navigate.to("/dashboard")
        else:
            ui.navigate.to("/login")
