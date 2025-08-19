import logging
from decimal import Decimal
from nicegui import ui
from app.inventory_service import InventoryService
from app.models import ProductCreate, ProductUpdate

logger = logging.getLogger(__name__)


def create():
    @ui.page("/products")
    def products_page():
        ui.colors(
            primary="#2563eb",
            secondary="#64748b",
            accent="#10b981",
            positive="#10b981",
            negative="#ef4444",
            warning="#f59e0b",
            info="#3b82f6",
        )

        with ui.column().classes("w-full p-6"):
            # Header
            ui.label("Product Management").classes("text-3xl font-bold text-gray-800 mb-6")

            # Action bar
            with ui.row().classes("w-full justify-between items-center mb-6"):
                with ui.row().classes("gap-4"):
                    ui.button("Add Product", on_click=lambda: add_product_dialog()).classes(
                        "bg-primary text-white px-4 py-2"
                    )
                    ui.button("Refresh", on_click=lambda: refresh_products()).classes(
                        "bg-secondary text-white px-4 py-2"
                    ).props("outline")

            # Products table container
            products_container = ui.column().classes("w-full")

            def refresh_products():
                """Refresh the products table"""
                products_container.clear()
                with products_container:
                    show_products_table()

            def show_products_table():
                """Display products in a table"""
                try:
                    products = InventoryService.get_all_products()

                    if not products:
                        ui.label('No products found. Click "Add Product" to create your first product.').classes(
                            "text-gray-500 text-center p-8"
                        )
                        return

                    # Create simplified table with just the data
                    with ui.card().classes("w-full p-6"):
                        ui.label("Products").classes("text-xl font-bold mb-4")

                        # Create table headers
                        with ui.row().classes("w-full font-bold border-b pb-2 mb-4"):
                            ui.label("Product Name").classes("flex-1")
                            ui.label("SKU").classes("w-32")
                            ui.label("Stock").classes("w-24 text-right")
                            ui.label("Actions").classes("w-32 text-center")

                        # Create table rows
                        for product in products:
                            with ui.row().classes("w-full items-center py-2 border-b border-gray-100"):
                                ui.label(product.name).classes("flex-1")
                                ui.label(product.sku).classes("w-32")
                                ui.label(str(product.current_stock)).classes("w-24 text-right")

                                # Actions column
                                with ui.row().classes("w-32 gap-1 justify-center"):
                                    if product.id is not None:
                                        product_id = product.id  # Capture the value
                                        ui.button(
                                            "Edit", on_click=lambda _=None, pid=product_id: handle_edit(pid)
                                        ).props("size=sm flat color=primary")
                                        ui.button(
                                            "Del", on_click=lambda _=None, pid=product_id: handle_delete(pid)
                                        ).props("size=sm flat color=negative")

                except Exception as e:
                    logger.error(f"Error loading products: {str(e)}")
                    ui.notify(f"Error loading products: {str(e)}", type="negative")

            def handle_edit(product_id: int):
                if product_id == 0:
                    return
                product = InventoryService.get_product_by_id(product_id)
                if product:
                    edit_product_dialog(product)

            def handle_delete(product_id: int):
                if product_id == 0:
                    return
                delete_product_dialog(product_id)

            def add_product_dialog():
                """Show dialog to add new product"""
                with ui.dialog() as dialog, ui.card().classes("w-96"):
                    ui.label("Add New Product").classes("text-xl font-bold mb-4")

                    name_input = ui.input("Product Name").classes("w-full mb-4")
                    sku_input = ui.input("SKU").classes("w-full mb-4")
                    stock_input = ui.number("Initial Stock", value=0, min=0, step=1).classes("w-full mb-4")

                    with ui.row().classes("gap-2 justify-end w-full"):
                        ui.button("Cancel", on_click=lambda: dialog.close()).props("outline")
                        ui.button("Save", on_click=lambda: save_new_product()).classes("bg-primary text-white")

                    def save_new_product():
                        try:
                            if not name_input.value or not sku_input.value:
                                ui.notify("Name and SKU are required", type="negative")
                                return

                            product_data = ProductCreate(
                                name=name_input.value,
                                sku=sku_input.value,
                                current_stock=Decimal(str(stock_input.value or 0)),
                            )

                            InventoryService.create_product(product_data)
                            ui.notify("Product created successfully!", type="positive")
                            dialog.close()
                            refresh_products()

                        except ValueError as e:
                            ui.notify(f"Error: {str(e)}", type="negative")
                        except Exception as e:
                            ui.notify(f"Unexpected error: {str(e)}", type="negative")

                dialog.open()

            def edit_product_dialog(product):
                """Show dialog to edit existing product"""
                with ui.dialog() as dialog, ui.card().classes("w-96"):
                    ui.label("Edit Product").classes("text-xl font-bold mb-4")

                    name_input = ui.input("Product Name", value=product.name).classes("w-full mb-4")
                    sku_input = ui.input("SKU", value=product.sku).classes("w-full mb-4")
                    stock_input = ui.number("Current Stock", value=float(product.current_stock), min=0, step=1).classes(
                        "w-full mb-4"
                    )

                    with ui.row().classes("gap-2 justify-end w-full"):
                        ui.button("Cancel", on_click=lambda: dialog.close()).props("outline")
                        ui.button("Save", on_click=lambda: save_product_changes()).classes("bg-primary text-white")

                    def save_product_changes():
                        try:
                            if not name_input.value or not sku_input.value:
                                ui.notify("Name and SKU are required", type="negative")
                                return

                            if product.id is None:
                                ui.notify("Product ID is missing", type="negative")
                                return

                            product_data = ProductUpdate(
                                name=name_input.value,
                                sku=sku_input.value,
                                current_stock=Decimal(str(stock_input.value or 0)),
                            )

                            updated_product = InventoryService.update_product(product.id, product_data)
                            if updated_product:
                                ui.notify("Product updated successfully!", type="positive")
                                dialog.close()
                                refresh_products()
                            else:
                                ui.notify("Product not found", type="negative")

                        except ValueError as e:
                            ui.notify(f"Error: {str(e)}", type="negative")
                        except Exception as e:
                            ui.notify(f"Unexpected error: {str(e)}", type="negative")

                dialog.open()

            def delete_product_dialog(product_id: int):
                """Show confirmation dialog for product deletion"""
                product = InventoryService.get_product_by_id(product_id)
                if not product:
                    ui.notify("Product not found", type="negative")
                    return

                with ui.dialog() as dialog, ui.card().classes("w-96"):
                    ui.label("Delete Product").classes("text-xl font-bold mb-4")
                    ui.label(f'Are you sure you want to delete "{product.name}"?').classes("text-gray-600 mb-4")
                    ui.label("This will also delete all associated stock transactions.").classes(
                        "text-red-600 text-sm mb-4"
                    )

                    with ui.row().classes("gap-2 justify-end w-full"):
                        ui.button("Cancel", on_click=lambda: dialog.close()).props("outline")
                        ui.button("Delete", on_click=lambda: confirm_delete()).classes("bg-negative text-white")

                    def confirm_delete():
                        try:
                            success = InventoryService.delete_product(product_id)
                            if success:
                                ui.notify("Product deleted successfully!", type="positive")
                                dialog.close()
                                refresh_products()
                            else:
                                ui.notify("Product not found", type="negative")
                        except Exception as e:
                            ui.notify(f"Error deleting product: {str(e)}", type="negative")

                dialog.open()

            # Initial load
            refresh_products()
