import logging
from nicegui import ui
from app.inventory_service import InventoryService

logger = logging.getLogger(__name__)


def create():
    @ui.page("/")
    def dashboard():
        ui.colors(
            primary="#2563eb",
            secondary="#64748b",
            accent="#10b981",
            positive="#10b981",
            negative="#ef4444",
            warning="#f59e0b",
            info="#3b82f6",
        )

        with ui.column().classes("w-full min-h-screen bg-gray-50"):
            # Header
            with ui.row().classes("w-full bg-white shadow-sm p-4 mb-6"):
                ui.label("📦 Inventory Management System").classes("text-2xl font-bold text-gray-800")

                # Navigation
                with ui.row().classes("gap-4 ml-auto"):
                    ui.link("Dashboard", "/").classes("text-primary hover:text-primary-dark")
                    ui.link("Products", "/products").classes("text-primary hover:text-primary-dark")
                    ui.link("Stock In", "/stock-in").classes("text-primary hover:text-primary-dark")
                    ui.link("Stock Out", "/stock-out").classes("text-primary hover:text-primary-dark")

            with ui.column().classes("w-full p-6"):
                # Dashboard title
                ui.label("Dashboard Overview").classes("text-3xl font-bold text-gray-800 mb-6")

                # Summary cards container
                summary_container = ui.row().classes("w-full gap-6 mb-8")

                # Recent activity container
                activity_container = ui.column().classes("w-full")

                def refresh_dashboard():
                    """Refresh dashboard data"""
                    summary_container.clear()
                    activity_container.clear()

                    with summary_container:
                        show_summary_cards()

                    with activity_container:
                        show_recent_activity()

                def show_summary_cards():
                    """Display inventory summary cards"""
                    try:
                        summary = InventoryService.get_inventory_summary()

                        # Total Products Card
                        with ui.card().classes(
                            "p-6 bg-white shadow-lg rounded-xl hover:shadow-xl transition-shadow flex-1"
                        ):
                            ui.label("Total Products").classes("text-sm text-gray-500 uppercase tracking-wider")
                            ui.label(str(summary["total_products"])).classes("text-3xl font-bold text-gray-800 mt-2")
                            ui.label("Active products in system").classes("text-sm text-gray-400 mt-1")

                        # Total Stock Units Card
                        with ui.card().classes(
                            "p-6 bg-white shadow-lg rounded-xl hover:shadow-xl transition-shadow flex-1"
                        ):
                            ui.label("Total Stock Units").classes("text-sm text-gray-500 uppercase tracking-wider")
                            ui.label(str(summary["total_stock_units"])).classes("text-3xl font-bold text-gray-800 mt-2")
                            ui.label("Items in inventory").classes("text-sm text-gray-400 mt-1")

                        # Low Stock Alert Card
                        low_stock_color = "text-red-500" if summary["low_stock_count"] > 0 else "text-green-500"
                        with ui.card().classes(
                            "p-6 bg-white shadow-lg rounded-xl hover:shadow-xl transition-shadow flex-1"
                        ):
                            ui.label("Low Stock Items").classes("text-sm text-gray-500 uppercase tracking-wider")
                            ui.label(str(summary["low_stock_count"])).classes(
                                f"text-3xl font-bold {low_stock_color} mt-2"
                            )
                            ui.label("Stock < 10 units").classes("text-sm text-gray-400 mt-1")

                        # Out of Stock Card
                        out_stock_color = "text-red-500" if summary["out_of_stock_count"] > 0 else "text-green-500"
                        with ui.card().classes(
                            "p-6 bg-white shadow-lg rounded-xl hover:shadow-xl transition-shadow flex-1"
                        ):
                            ui.label("Out of Stock").classes("text-sm text-gray-500 uppercase tracking-wider")
                            ui.label(str(summary["out_of_stock_count"])).classes(
                                f"text-3xl font-bold {out_stock_color} mt-2"
                            )
                            ui.label("Items needing restock").classes("text-sm text-gray-400 mt-1")

                    except Exception as e:
                        logger.error(f"Error loading dashboard summary: {str(e)}")
                        ui.label(f"Error loading summary: {str(e)}").classes("text-red-500")

                def show_recent_activity():
                    """Display recent transaction activity"""
                    try:
                        # Recent transactions section
                        with ui.row().classes("w-full gap-6"):
                            # Recent Stock In
                            with ui.card().classes("p-6 bg-white shadow-lg rounded-xl flex-1"):
                                ui.label("Recent Stock In").classes("text-xl font-bold text-gray-800 mb-4")

                                recent_in = InventoryService.get_stock_in_transactions(limit=5)
                                if recent_in:
                                    for transaction in recent_in:
                                        product = InventoryService.get_product_by_id(transaction.product_id)
                                        product_name = product.name if product else f"Product #{transaction.product_id}"

                                        with ui.row().classes(
                                            "justify-between items-center py-2 border-b border-gray-100"
                                        ):
                                            with ui.column():
                                                ui.label(product_name).classes("font-medium text-gray-800")
                                                ui.label(f"Qty: {transaction.quantity}").classes(
                                                    "text-sm text-gray-500"
                                                )
                                            ui.label(transaction.transaction_date.strftime("%m/%d")).classes(
                                                "text-sm text-gray-400"
                                            )
                                else:
                                    ui.label("No recent stock-in transactions").classes("text-gray-500")

                                with ui.row().classes("justify-end mt-4"):
                                    ui.link("View All", "/stock-in").classes("text-primary text-sm")

                            # Recent Stock Out
                            with ui.card().classes("p-6 bg-white shadow-lg rounded-xl flex-1"):
                                ui.label("Recent Stock Out").classes("text-xl font-bold text-gray-800 mb-4")

                                recent_out = InventoryService.get_stock_out_transactions(limit=5)
                                if recent_out:
                                    for transaction in recent_out:
                                        product = InventoryService.get_product_by_id(transaction.product_id)
                                        product_name = product.name if product else f"Product #{transaction.product_id}"

                                        with ui.row().classes(
                                            "justify-between items-center py-2 border-b border-gray-100"
                                        ):
                                            with ui.column():
                                                ui.label(product_name).classes("font-medium text-gray-800")
                                                ui.label(f"Qty: {transaction.quantity} ({transaction.reason})").classes(
                                                    "text-sm text-gray-500"
                                                )
                                            ui.label(transaction.transaction_date.strftime("%m/%d")).classes(
                                                "text-sm text-gray-400"
                                            )
                                else:
                                    ui.label("No recent stock-out transactions").classes("text-gray-500")

                                with ui.row().classes("justify-end mt-4"):
                                    ui.link("View All", "/stock-out").classes("text-primary text-sm")

                        # Low Stock Alerts
                        summary = InventoryService.get_inventory_summary()
                        if summary["low_stock_products"] or summary["out_of_stock_products"]:
                            with ui.card().classes("p-6 bg-white shadow-lg rounded-xl mt-6"):
                                ui.label("Stock Alerts").classes("text-xl font-bold text-gray-800 mb-4")

                                # Out of stock items
                                if summary["out_of_stock_products"]:
                                    ui.label("⚠️ Out of Stock Items").classes("text-lg font-semibold text-red-600 mb-2")
                                    for product in summary["out_of_stock_products"][:5]:  # Show max 5
                                        with ui.row().classes("justify-between items-center py-1"):
                                            ui.label(f"{product.name} ({product.sku})").classes("text-gray-800")
                                            ui.label("0 units").classes("text-red-500 font-medium")

                                # Low stock items
                                if summary["low_stock_products"]:
                                    ui.label("🔸 Low Stock Items").classes(
                                        "text-lg font-semibold text-orange-600 mb-2 mt-4"
                                    )
                                    for product in summary["low_stock_products"][:5]:  # Show max 5
                                        if product.current_stock > 0:  # Don't duplicate out of stock items
                                            with ui.row().classes("justify-between items-center py-1"):
                                                ui.label(f"{product.name} ({product.sku})").classes("text-gray-800")
                                                ui.label(f"{product.current_stock} units").classes(
                                                    "text-orange-500 font-medium"
                                                )

                                with ui.row().classes("justify-end mt-4"):
                                    ui.link("Manage Products", "/products").classes("text-primary text-sm")

                    except Exception as e:
                        logger.error(f"Error loading dashboard activity: {str(e)}")
                        ui.label(f"Error loading activity: {str(e)}").classes("text-red-500")

                # Quick Actions
                with ui.card().classes("p-6 bg-white shadow-lg rounded-xl mt-6"):
                    ui.label("Quick Actions").classes("text-xl font-bold text-gray-800 mb-4")
                    with ui.row().classes("gap-4"):
                        ui.button("Add New Product", on_click=lambda: ui.navigate.to("/products")).classes(
                            "bg-primary text-white px-4 py-2"
                        )
                        ui.button("Record Stock In", on_click=lambda: ui.navigate.to("/stock-in")).classes(
                            "bg-accent text-white px-4 py-2"
                        )
                        ui.button("Record Stock Out", on_click=lambda: ui.navigate.to("/stock-out")).classes(
                            "bg-warning text-white px-4 py-2"
                        )
                        ui.button("Refresh Dashboard", on_click=lambda: refresh_dashboard()).classes(
                            "bg-secondary text-white px-4 py-2"
                        ).props("outline")

                # Initial load
                refresh_dashboard()
