"""Currency conversion UI module."""

from nicegui import ui
from decimal import Decimal
import asyncio
import logging

from app.currency_service import CurrencyService, CurrencyConversionError, ConversionRequestCreate

logger = logging.getLogger(__name__)

# Modern color scheme
COLORS = {
    "primary": "#2563eb",
    "success": "#10b981",
    "error": "#ef4444",
    "warning": "#f59e0b",
    "background": "#f8fafc",
    "card": "#ffffff",
    "text": "#1f2937",
    "text_muted": "#6b7280",
}

# Typography classes
TEXT_STYLES = {
    "heading": "text-3xl font-bold text-gray-800 mb-2",
    "subheading": "text-lg font-semibold text-gray-700 mb-4",
    "body": "text-base text-gray-600 leading-relaxed",
    "caption": "text-sm text-gray-500",
    "result": "text-2xl font-bold text-green-600",
    "error": "text-red-600 font-medium",
}


def create():
    """Create the currency converter module."""

    @ui.page("/currency-converter")
    async def currency_converter_page():
        """Main currency converter page."""

        # Sync currencies on page load
        try:
            await CurrencyService.sync_currencies()
        except Exception as e:
            logger.warning(f"Failed to sync currencies: {e}")

        # Get available currencies
        currencies = CurrencyService.get_available_currencies()
        currency_options = {currency.code: f"{currency.code} - {currency.name}" for currency in currencies}

        if not currency_options:
            # Fallback currencies if sync failed
            currency_options = {
                "USD": "USD - US Dollar",
                "EUR": "EUR - Euro",
                "GBP": "GBP - British Pound",
                "JPY": "JPY - Japanese Yen",
                "CHF": "CHF - Swiss Franc",
                "CAD": "CAD - Canadian Dollar",
                "AUD": "AUD - Australian Dollar",
            }

        # Page styling
        ui.add_head_html("""
        <style>
            .currency-card {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border-radius: 1rem;
                padding: 2rem;
                box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            }
            .result-card {
                background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
                border-radius: 1rem;
                padding: 1.5rem;
                box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
                transform: scale(1);
                transition: transform 0.2s ease-in-out;
            }
            .result-card.animate {
                animation: bounceIn 0.6s ease-out;
            }
            @keyframes bounceIn {
                0% { opacity: 0; transform: scale(0.3); }
                50% { opacity: 1; transform: scale(1.05); }
                70% { transform: scale(0.9); }
                100% { opacity: 1; transform: scale(1); }
            }
        </style>
        """)

        with ui.column().classes("w-full min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4"):
            # Header
            with ui.row().classes("w-full justify-center mb-8"):
                with ui.column().classes("text-center"):
                    ui.label("💱 Currency Converter").classes("text-4xl font-bold text-gray-800 mb-2")
                    ui.label("Get real-time exchange rates powered by Frankfurter API").classes("text-lg text-gray-600")

            # Main converter card
            with ui.row().classes("w-full justify-center"):
                with ui.card().classes("currency-card max-w-2xl w-full"):
                    with ui.column().classes("space-y-6"):
                        # Amount input
                        ui.label("Amount to Convert").classes("text-white font-semibold text-lg mb-2")
                        amount_input = (
                            ui.number(label="Enter amount", value=100.00, format="%.2f", min=0.01, step=0.01)
                            .classes("w-full")
                            .props("outlined dense bg-color=white")
                        )

                        # Currency selection row
                        with ui.row().classes("w-full gap-4"):
                            # Source currency
                            with ui.column().classes("flex-1"):
                                ui.label("From Currency").classes("text-white font-semibold mb-2")
                                source_select = (
                                    ui.select(options=currency_options, value="USD", with_input=True)
                                    .classes("w-full")
                                    .props("outlined dense bg-color=white")
                                )

                            # Swap button
                            with ui.column().classes("justify-end"):
                                ui.button("⇄", on_click=lambda: swap_currencies()).classes(
                                    "bg-white text-indigo-600 font-bold text-xl px-4 py-2 rounded-full hover:bg-gray-100 transition-colors"
                                )

                            # Target currency
                            with ui.column().classes("flex-1"):
                                ui.label("To Currency").classes("text-white font-semibold mb-2")
                                target_select = (
                                    ui.select(options=currency_options, value="EUR", with_input=True)
                                    .classes("w-full")
                                    .props("outlined dense bg-color=white")
                                )

                        # Convert button
                        convert_button = ui.button(
                            "🔄 Convert Currency", on_click=lambda: asyncio.create_task(perform_conversion())
                        ).classes(
                            "w-full bg-yellow-400 text-gray-800 font-bold py-3 px-6 rounded-lg hover:bg-yellow-300 transition-colors text-lg"
                        )

            # Results section
            result_container = ui.column().classes("w-full max-w-2xl mx-auto mt-8")

            # History section
            with ui.row().classes("w-full justify-center mt-8"):
                with ui.card().classes("max-w-4xl w-full bg-white shadow-lg rounded-xl p-6"):
                    ui.label("🕒 Recent Conversions").classes("text-2xl font-bold text-gray-800 mb-4")
                    history_container = ui.column().classes("w-full")

        async def update_history():
            """Update conversion history display."""
            try:
                with history_container:
                    history_container.clear()

                    history = CurrencyService.get_conversion_history(limit=10)

                    if not history:
                        ui.label("No conversions yet. Start by converting a currency above!").classes(
                            "text-gray-500 italic text-center py-8"
                        )
                        return

                    # Create history table
                    columns = [
                        {"name": "date", "label": "Date", "field": "date", "align": "left"},
                        {"name": "amount", "label": "Amount", "field": "amount", "align": "right"},
                        {"name": "from", "label": "From", "field": "from", "align": "center"},
                        {"name": "to", "label": "To", "field": "to", "align": "center"},
                        {"name": "rate", "label": "Rate", "field": "rate", "align": "right"},
                        {"name": "result", "label": "Result", "field": "result", "align": "right"},
                        {"name": "status", "label": "Status", "field": "status", "align": "center"},
                    ]

                    rows = []
                    for conversion in history:
                        status_icon = "✅" if conversion.success else "❌"
                        result_text = f"{conversion.converted_amount:,.2f}" if conversion.converted_amount else "Failed"
                        rate_text = f"{conversion.exchange_rate:.6f}" if conversion.exchange_rate else "N/A"

                        rows.append(
                            {
                                "date": conversion.created_at.strftime("%m/%d %H:%M"),
                                "amount": f"{conversion.amount:,.2f}",
                                "from": conversion.source_currency,
                                "to": conversion.target_currency,
                                "rate": rate_text,
                                "result": result_text,
                                "status": status_icon,
                            }
                        )

                    ui.table(columns=columns, rows=rows, row_key="date").classes("w-full").props("dense")

            except Exception as e:
                logger.error(f"Failed to update history: {e}")
                with history_container:
                    history_container.clear()
                    ui.label("Failed to load conversion history").classes("text-red-500 text-center")

        def swap_currencies():
            """Swap source and target currencies."""
            source_value = source_select.value
            target_value = target_select.value
            source_select.set_value(target_value)
            target_select.set_value(source_value)

        async def perform_conversion():
            """Perform currency conversion with validation and error handling."""
            try:
                # Validate inputs
                amount_value = amount_input.value
                source_currency = source_select.value
                target_currency = target_select.value

                if not amount_value or amount_value <= 0:
                    ui.notify("Please enter a valid positive amount", type="negative")
                    return

                if not source_currency or not target_currency:
                    ui.notify("Please select both source and target currencies", type="negative")
                    return

                if source_currency == target_currency:
                    ui.notify("Source and target currencies must be different", type="negative")
                    return

                # Show loading state
                convert_button.set_text("Converting... ⏳")
                convert_button.disable()

                # Create conversion request
                request = ConversionRequestCreate(
                    amount=Decimal(str(amount_value)), source_currency=source_currency, target_currency=target_currency
                )

                # Perform conversion
                result = await CurrencyService.convert_currency(request)

                # Display result
                with result_container:
                    result_container.clear()
                    with ui.card().classes("result-card animate"):
                        with ui.column().classes("space-y-4 text-center"):
                            ui.label("💰 Conversion Result").classes("text-white font-bold text-xl")

                            # Amount display
                            with ui.row().classes("justify-center items-center gap-2"):
                                ui.label(f"{result.original_amount:,.2f} {result.source_currency}").classes(
                                    "text-white text-2xl font-bold"
                                )
                                ui.label("=").classes("text-white text-xl")
                                ui.label(f"{result.converted_amount:,.2f} {result.target_currency}").classes(
                                    "text-white text-2xl font-bold"
                                )

                            # Exchange rate
                            ui.label(
                                f"Exchange Rate: 1 {result.source_currency} = {result.exchange_rate:.6f} {result.target_currency}"
                            ).classes("text-white opacity-90")

                            # Timestamp
                            ui.label(
                                f"Converted at: {result.conversion_date.strftime('%Y-%m-%d %H:%M:%S UTC')}"
                            ).classes("text-white opacity-75 text-sm")

                # Update history
                await update_history()

                ui.notify(
                    f"Successfully converted {result.original_amount} {result.source_currency} to {result.converted_amount:.2f} {result.target_currency}",
                    type="positive",
                )

            except CurrencyConversionError as e:
                # Clear results on error
                result_container.clear()
                ui.notify(f"Conversion failed: {str(e)}", type="negative")
                logger.error(f"Conversion error: {e}")

            except Exception as e:
                # Clear results on unexpected error
                result_container.clear()
                ui.notify("An unexpected error occurred. Please try again.", type="negative")
                logger.error(f"Unexpected conversion error: {e}")

            finally:
                # Reset button state
                convert_button.set_text("🔄 Convert Currency")
                convert_button.enable()

        # Load initial history
        await update_history()

    @ui.page("/")
    async def index():
        """Redirect index to currency converter."""
        ui.navigate.to("/currency-converter")
