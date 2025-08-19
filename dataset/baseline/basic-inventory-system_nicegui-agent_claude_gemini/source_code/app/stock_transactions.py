import logging
from decimal import Decimal
from datetime import datetime, date
from nicegui import ui
from app.inventory_service import InventoryService
from app.models import StockInTransactionCreate, StockOutTransactionCreate

logger = logging.getLogger(__name__)


def create():
    @ui.page("/stock-in")
    def stock_in_page():
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
            ui.label("Stock In Transactions").classes("text-3xl font-bold text-gray-800 mb-6")

            with ui.row().classes("w-full gap-6"):
                # Left column - Add transaction form
                with ui.column().classes("w-96"):
                    with ui.card().classes("p-6"):
                        ui.label("Add Stock In").classes("text-xl font-bold mb-4")

                        # Product selection
                        products = InventoryService.get_all_products()
                        if not products:
                            ui.label("No products available. Please create products first.").classes("text-gray-500")
                            ui.link("Go to Products", "/products").classes("text-primary")
                            return

                        product_options = {str(p.id): f"{p.name} ({p.sku})" for p in products if p.id is not None}
                        product_select = ui.select(options=product_options, label="Product").classes("w-full mb-4")

                        quantity_input = ui.number("Quantity", min=0.01, step=1, value=1).classes("w-full mb-4")
                        unit_cost_input = ui.number("Unit Cost (Optional)", min=0, step=0.01).classes("w-full mb-4")
                        supplier_input = ui.input("Supplier (Optional)").classes("w-full mb-4")
                        reference_input = ui.input("Reference Number (Optional)").classes("w-full mb-4")
                        notes_input = ui.textarea("Notes (Optional)").classes("w-full mb-4")

                        transaction_date = (
                            ui.date(value=date.today().isoformat())
                            .props('label="Transaction Date"')
                            .classes("w-full mb-4")
                        )

                        with ui.row().classes("gap-2 w-full"):
                            ui.button("Clear", on_click=lambda: clear_form()).props("outline")
                            ui.button("Add Stock In", on_click=lambda: add_stock_in()).classes("bg-primary text-white")

                        def clear_form():
                            product_select.set_value(None)
                            quantity_input.set_value(1)
                            unit_cost_input.set_value(None)
                            supplier_input.set_value("")
                            reference_input.set_value("")
                            notes_input.set_value("")
                            transaction_date.set_value(date.today().isoformat())

                        def add_stock_in():
                            try:
                                if not product_select.value:
                                    ui.notify("Please select a product", type="negative")
                                    return

                                if not quantity_input.value or quantity_input.value <= 0:
                                    ui.notify("Please enter a valid quantity", type="negative")
                                    return

                                # Parse transaction date
                                trans_date = (
                                    datetime.strptime(transaction_date.value, "%Y-%m-%d")
                                    if transaction_date.value
                                    else datetime.now()
                                )

                                transaction_data = StockInTransactionCreate(
                                    product_id=int(product_select.value),
                                    quantity=Decimal(str(quantity_input.value)),
                                    unit_cost=Decimal(str(unit_cost_input.value)) if unit_cost_input.value else None,
                                    supplier=supplier_input.value or None,
                                    reference_number=reference_input.value or None,
                                    notes=notes_input.value or None,
                                    transaction_date=trans_date,
                                )

                                InventoryService.record_stock_in(transaction_data)
                                ui.notify("Stock in transaction recorded successfully!", type="positive")
                                clear_form()
                                refresh_transactions()

                            except ValueError as e:
                                ui.notify(f"Error: {str(e)}", type="negative")
                            except Exception as e:
                                logger.error(f"Error recording stock in transaction: {str(e)}")
                                ui.notify(f"Unexpected error: {str(e)}", type="negative")

                # Right column - Recent transactions
                with ui.column().classes("flex-1"):
                    transactions_container = ui.column().classes("w-full")

                    def refresh_transactions():
                        """Refresh the transactions table"""
                        transactions_container.clear()
                        with transactions_container:
                            show_transactions_table()

                    def show_transactions_table():
                        """Display recent stock-in transactions"""
                        try:
                            transactions = InventoryService.get_stock_in_transactions(limit=50)

                            if not transactions:
                                ui.label("No stock-in transactions recorded yet.").classes("text-gray-500 p-4")
                                return

                            ui.label("Recent Stock In Transactions").classes("text-xl font-bold mb-4")

                            columns = [
                                {"name": "date", "label": "Date", "field": "date", "align": "left"},
                                {"name": "product", "label": "Product", "field": "product", "align": "left"},
                                {"name": "quantity", "label": "Quantity", "field": "quantity", "align": "right"},
                                {"name": "unit_cost", "label": "Unit Cost", "field": "unit_cost", "align": "right"},
                                {"name": "supplier", "label": "Supplier", "field": "supplier", "align": "left"},
                                {"name": "reference", "label": "Reference", "field": "reference", "align": "left"},
                            ]

                            rows = []
                            for transaction in transactions:
                                product = InventoryService.get_product_by_id(transaction.product_id)
                                product_name = product.name if product else f"Product #{transaction.product_id}"

                                rows.append(
                                    {
                                        "date": transaction.transaction_date.strftime("%Y-%m-%d %H:%M"),
                                        "product": product_name,
                                        "quantity": str(transaction.quantity),
                                        "unit_cost": f"${transaction.unit_cost:.2f}" if transaction.unit_cost else "-",
                                        "supplier": transaction.supplier or "-",
                                        "reference": transaction.reference_number or "-",
                                    }
                                )

                            ui.table(columns=columns, rows=rows).classes("w-full")

                        except Exception as e:
                            logger.error(f"Error loading stock in transactions: {str(e)}")
                            ui.notify(f"Error loading transactions: {str(e)}", type="negative")

                    # Initial load
                    refresh_transactions()

    @ui.page("/stock-out")
    def stock_out_page():
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
            ui.label("Stock Out Transactions").classes("text-3xl font-bold text-gray-800 mb-6")

            with ui.row().classes("w-full gap-6"):
                # Left column - Add transaction form
                with ui.column().classes("w-96"):
                    with ui.card().classes("p-6"):
                        ui.label("Add Stock Out").classes("text-xl font-bold mb-4")

                        # Product selection
                        products = InventoryService.get_all_products()
                        if not products:
                            ui.label("No products available. Please create products first.").classes("text-gray-500")
                            ui.link("Go to Products", "/products").classes("text-primary")
                            return

                        # Filter to products with stock > 0
                        available_products = [p for p in products if p.current_stock > 0]
                        if not available_products:
                            ui.label("No products with available stock.").classes("text-warning")

                        product_options = {
                            str(p.id): f"{p.name} ({p.sku}) - Stock: {p.current_stock}"
                            for p in available_products
                            if p.id is not None
                        }
                        product_select = ui.select(options=product_options, label="Product").classes("w-full mb-4")

                        quantity_input = ui.number("Quantity", min=0.01, step=1, value=1).classes("w-full mb-4")

                        reason_options = ["Sale", "Damage", "Loss", "Theft", "Return", "Transfer", "Other"]
                        reason_select = ui.select(options=reason_options, value="Sale", label="Reason").classes(
                            "w-full mb-4"
                        )

                        reference_input = ui.input("Reference Number (Optional)").classes("w-full mb-4")
                        notes_input = ui.textarea("Notes (Optional)").classes("w-full mb-4")

                        transaction_date = (
                            ui.date(value=date.today().isoformat())
                            .props('label="Transaction Date"')
                            .classes("w-full mb-4")
                        )

                        with ui.row().classes("gap-2 w-full"):
                            ui.button("Clear", on_click=lambda: clear_out_form()).props("outline")
                            ui.button("Add Stock Out", on_click=lambda: add_stock_out()).classes(
                                "bg-warning text-white"
                            )

                        def clear_out_form():
                            product_select.set_value(None)
                            quantity_input.set_value(1)
                            reason_select.set_value("Sale")
                            reference_input.set_value("")
                            notes_input.set_value("")
                            transaction_date.set_value(date.today().isoformat())

                        def add_stock_out():
                            try:
                                if not product_select.value:
                                    ui.notify("Please select a product", type="negative")
                                    return

                                if not quantity_input.value or quantity_input.value <= 0:
                                    ui.notify("Please enter a valid quantity", type="negative")
                                    return

                                # Check available stock
                                product = InventoryService.get_product_by_id(int(product_select.value))
                                if not product:
                                    ui.notify("Selected product not found", type="negative")
                                    return

                                if product.current_stock < Decimal(str(quantity_input.value)):
                                    ui.notify(
                                        f"Insufficient stock. Available: {product.current_stock}", type="negative"
                                    )
                                    return

                                # Parse transaction date
                                trans_date = (
                                    datetime.strptime(transaction_date.value, "%Y-%m-%d")
                                    if transaction_date.value
                                    else datetime.now()
                                )

                                transaction_data = StockOutTransactionCreate(
                                    product_id=int(product_select.value),
                                    quantity=Decimal(str(quantity_input.value)),
                                    reason=reason_select.value or "Sale",
                                    reference_number=reference_input.value or None,
                                    notes=notes_input.value or None,
                                    transaction_date=trans_date,
                                )

                                InventoryService.record_stock_out(transaction_data)
                                ui.notify("Stock out transaction recorded successfully!", type="positive")
                                clear_out_form()
                                refresh_out_transactions()

                                # Update product options to reflect new stock levels
                                refresh_product_options()

                            except ValueError as e:
                                ui.notify(f"Error: {str(e)}", type="negative")
                            except Exception as e:
                                logger.error(f"Error recording stock out transaction: {str(e)}")
                                ui.notify(f"Unexpected error: {str(e)}", type="negative")

                        def refresh_product_options():
                            """Update product dropdown with current stock levels"""
                            products = InventoryService.get_all_products()
                            available_products = [p for p in products if p.current_stock > 0]
                            new_options = {
                                str(p.id): f"{p.name} ({p.sku}) - Stock: {p.current_stock}"
                                for p in available_products
                                if p.id is not None
                            }
                            product_select.set_options(new_options)

                # Right column - Recent transactions
                with ui.column().classes("flex-1"):
                    out_transactions_container = ui.column().classes("w-full")

                    def refresh_out_transactions():
                        """Refresh the transactions table"""
                        out_transactions_container.clear()
                        with out_transactions_container:
                            show_out_transactions_table()

                    def show_out_transactions_table():
                        """Display recent stock-out transactions"""
                        try:
                            transactions = InventoryService.get_stock_out_transactions(limit=50)

                            if not transactions:
                                ui.label("No stock-out transactions recorded yet.").classes("text-gray-500 p-4")
                                return

                            ui.label("Recent Stock Out Transactions").classes("text-xl font-bold mb-4")

                            columns = [
                                {"name": "date", "label": "Date", "field": "date", "align": "left"},
                                {"name": "product", "label": "Product", "field": "product", "align": "left"},
                                {"name": "quantity", "label": "Quantity", "field": "quantity", "align": "right"},
                                {"name": "reason", "label": "Reason", "field": "reason", "align": "left"},
                                {"name": "reference", "label": "Reference", "field": "reference", "align": "left"},
                            ]

                            rows = []
                            for transaction in transactions:
                                product = InventoryService.get_product_by_id(transaction.product_id)
                                product_name = product.name if product else f"Product #{transaction.product_id}"

                                rows.append(
                                    {
                                        "date": transaction.transaction_date.strftime("%Y-%m-%d %H:%M"),
                                        "product": product_name,
                                        "quantity": str(transaction.quantity),
                                        "reason": transaction.reason,
                                        "reference": transaction.reference_number or "-",
                                    }
                                )

                            ui.table(columns=columns, rows=rows).classes("w-full")

                        except Exception as e:
                            logger.error(f"Error loading stock out transactions: {str(e)}")
                            ui.notify(f"Error loading transactions: {str(e)}", type="negative")

                    # Initial load
                    refresh_out_transactions()
