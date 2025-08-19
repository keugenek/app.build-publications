from nicegui import ui
from typing import List, Optional
from app.category_service import CategoryService
from app.models import Category, CategoryCreate, CategoryUpdate
from app.theme import ThemeStyles


def create_category_dialog(user_id: int, on_success=None):
    """Create a dialog for adding new categories"""

    with ui.dialog() as dialog, ui.card().classes("w-96 p-6"):
        ui.label("New Category").classes(ThemeStyles.SUBHEADING)

        name_input = ui.input("Category Name", placeholder="e.g., Work, Personal").classes(ThemeStyles.INPUT)
        description_input = (
            ui.textarea("Description (optional)", placeholder="Brief description...")
            .classes(ThemeStyles.TEXTAREA)
            .props("rows=3")
        )

        # Color picker
        ui.label("Color").classes("text-sm font-medium text-gray-700 mt-4 mb-2")
        color_options = ["#E3F2FD", "#F3E5F5", "#E8F5E8", "#FFF3E0", "#FCE4EC", "#E0F2F1", "#F1F8E9", "#FFF8E1"]

        selected_color = {"value": "#E3F2FD"}
        color_container = ui.row().classes("gap-2 flex-wrap")

        def create_color_button(color):
            def select_color():
                selected_color["value"] = color
                update_color_buttons()

            return (
                ui.button()
                .props("flat")
                .classes("w-8 h-8 rounded-full border-2")
                .style(
                    f"background-color: {color}; border-color: {'#4A90C2' if color == selected_color['value'] else '#ddd'}"
                )
                .on("click", select_color)
            )

        def update_color_buttons():
            color_container.clear()
            with color_container:
                for color in color_options:
                    create_color_button(color)

        update_color_buttons()

        async def save_category():
            if not name_input.value:
                ui.notify("Please enter a category name", type="negative")
                return

            try:
                category_data = CategoryCreate(
                    name=name_input.value, description=description_input.value or "", color=selected_color["value"]
                )

                category = CategoryService.create_category(user_id, category_data)
                if category:
                    ui.notify(f'Category "{category.name}" created!', type="positive")
                    dialog.submit(True)
                    if on_success:
                        on_success()
                else:
                    ui.notify("Failed to create category", type="negative")
            except Exception:
                ui.notify("Error creating category", type="negative")

        with ui.row().classes("w-full justify-end gap-2 mt-6"):
            ui.button("Cancel", on_click=lambda: dialog.submit(False)).classes(ThemeStyles.OUTLINE_BUTTON)
            ui.button("Save", on_click=save_category).classes(ThemeStyles.PRIMARY_BUTTON)

    return dialog


def create_edit_category_dialog(user_id: int, category: Category, on_success=None):
    """Create a dialog for editing existing categories"""

    with ui.dialog() as dialog, ui.card().classes("w-96 p-6"):
        ui.label("Edit Category").classes(ThemeStyles.SUBHEADING)

        name_input = ui.input("Category Name", value=category.name).classes(ThemeStyles.INPUT)
        description_input = (
            ui.textarea("Description", value=category.description).classes(ThemeStyles.TEXTAREA).props("rows=3")
        )

        # Color picker
        ui.label("Color").classes("text-sm font-medium text-gray-700 mt-4 mb-2")
        color_options = ["#E3F2FD", "#F3E5F5", "#E8F5E8", "#FFF3E0", "#FCE4EC", "#E0F2F1", "#F1F8E9", "#FFF8E1"]

        selected_color = {"value": category.color}
        color_container = ui.row().classes("gap-2 flex-wrap")

        def create_color_button(color):
            def select_color():
                selected_color["value"] = color
                update_color_buttons()

            return (
                ui.button()
                .props("flat")
                .classes("w-8 h-8 rounded-full border-2")
                .style(
                    f"background-color: {color}; border-color: {'#4A90C2' if color == selected_color['value'] else '#ddd'}"
                )
                .on("click", select_color)
            )

        def update_color_buttons():
            color_container.clear()
            with color_container:
                for color in color_options:
                    create_color_button(color)

        update_color_buttons()

        async def save_category():
            if not name_input.value:
                ui.notify("Please enter a category name", type="negative")
                return

            try:
                update_data = CategoryUpdate(
                    name=name_input.value, description=description_input.value or "", color=selected_color["value"]
                )

                if category.id is not None:
                    updated_category = CategoryService.update_category(category.id, user_id, update_data)
                    if updated_category:
                        ui.notify(f'Category "{updated_category.name}" updated!', type="positive")
                        dialog.submit(True)
                        if on_success:
                            on_success()
                    else:
                        ui.notify("Failed to update category", type="negative")
                else:
                    ui.notify("Invalid category", type="negative")
            except Exception:
                ui.notify("Error updating category", type="negative")

        async def delete_category():
            with ui.dialog() as confirm_dialog, ui.card():
                ui.label("Delete Category?").classes("text-lg font-semibold mb-4")
                ui.label(
                    "This will remove the category from all notes. Notes will remain but become uncategorized."
                ).classes("text-gray-600 mb-4")

                with ui.row().classes("gap-2 justify-end"):
                    ui.button("Cancel", on_click=lambda: confirm_dialog.submit(False)).classes(
                        ThemeStyles.OUTLINE_BUTTON
                    )
                    ui.button("Delete", on_click=lambda: confirm_dialog.submit(True)).classes(
                        "bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
                    )

            result = await confirm_dialog
            if result and category.id is not None:
                success = CategoryService.delete_category(category.id, user_id)
                if success:
                    ui.notify(f'Category "{category.name}" deleted', type="info")
                    dialog.submit(True)
                    if on_success:
                        on_success()
                else:
                    ui.notify("Failed to delete category", type="negative")

        with ui.row().classes("w-full justify-between mt-6"):
            ui.button("Delete", on_click=delete_category).classes(
                "bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
            )

            with ui.row().classes("gap-2"):
                ui.button("Cancel", on_click=lambda: dialog.submit(False)).classes(ThemeStyles.OUTLINE_BUTTON)
                ui.button("Save", on_click=save_category).classes(ThemeStyles.PRIMARY_BUTTON)

    return dialog


def create_category_list(
    user_id: int,
    categories: List[Category],
    selected_category_id: Optional[int] = None,
    on_category_select=None,
    on_refresh=None,
):
    """Create a list of categories for the sidebar"""

    with ui.column().classes("w-full gap-2"):
        # All Notes option
        is_all_selected = selected_category_id is None
        all_notes_classes = ThemeStyles.ACTIVE_NAV_ITEM if is_all_selected else ThemeStyles.NAV_ITEM

        def select_all_notes():
            if on_category_select:
                on_category_select(None)

        ui.button("📝 All Notes", on_click=select_all_notes).classes(all_notes_classes).props("flat")

        # Uncategorized option
        is_uncategorized_selected = selected_category_id == -1
        uncategorized_classes = ThemeStyles.ACTIVE_NAV_ITEM if is_uncategorized_selected else ThemeStyles.NAV_ITEM

        def select_uncategorized():
            if on_category_select:
                on_category_select(-1)

        ui.button("📂 Uncategorized", on_click=select_uncategorized).classes(uncategorized_classes).props("flat")

        ui.separator().classes("my-2")

        # Categories header with add button
        with ui.row().classes("w-full items-center justify-between mb-2"):
            ui.label("Categories").classes("text-sm font-semibold text-gray-600 uppercase tracking-wider")

            async def add_category():
                dialog = create_category_dialog(user_id, on_success=on_refresh)
                await dialog

            ui.button(icon="add").props("flat round size=sm").classes("text-blue-600").on("click", add_category)

        # Category list
        if not categories:
            ui.label("No categories yet").classes("text-gray-500 text-sm text-center py-4")
        else:
            for category in categories:
                is_selected = selected_category_id == category.id
                button_classes = ThemeStyles.ACTIVE_NAV_ITEM if is_selected else ThemeStyles.NAV_ITEM

                def create_select_handler(cat_id):
                    def select_category():
                        if on_category_select:
                            on_category_select(cat_id)

                    return select_category

                def create_edit_handler(cat):
                    async def edit_category():
                        dialog = create_edit_category_dialog(user_id, cat, on_success=on_refresh)
                        await dialog

                    return edit_category

                with ui.row().classes("w-full items-center gap-1"):
                    # Color indicator
                    ui.element("div").classes("w-3 h-3 rounded-full flex-shrink-0").style(
                        f"background-color: {category.color}"
                    )

                    # Category button
                    ui.button(category.name, on_click=create_select_handler(category.id)).classes(
                        f"{button_classes} flex-1 justify-start"
                    ).props("flat")

                    # Edit button
                    ui.button(icon="edit").props("flat round size=xs").classes("text-gray-400 hover:text-gray-600").on(
                        "click", create_edit_handler(category)
                    )
