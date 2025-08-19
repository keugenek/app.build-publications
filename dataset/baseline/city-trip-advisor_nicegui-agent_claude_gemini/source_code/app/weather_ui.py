"""Weather forecast UI components."""

from nicegui import ui
from datetime import date, timedelta
from app.trip_service import get_trip_recommendation
from app.weather_service import CityNotFoundError, WeatherAPIError
import logging

logger = logging.getLogger(__name__)


def create():
    """Create the weather forecast UI pages."""

    # Apply modern theme
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
    def weather_page():
        # Page header
        with ui.row().classes("w-full justify-center mb-8"):
            ui.label("🌤️ Weather Trip Advisor").classes("text-4xl font-bold text-primary")

        with ui.row().classes("w-full justify-center"):
            ui.label("Get weather-based trip recommendations for tomorrow").classes("text-lg text-gray-600 text-center")

        # Main content container
        with ui.row().classes("w-full justify-center mt-12"):
            with ui.card().classes("w-96 p-8 shadow-xl rounded-2xl bg-white"):
                # Input section
                ui.label("Enter City Name").classes("text-lg font-semibold text-gray-700 mb-4")

                city_input = (
                    ui.input(placeholder="e.g., London, Paris, Tokyo...").classes("w-full mb-6").props("outlined dense")
                )

                # Search button
                ui.button(
                    "Check Weather & Get Recommendation", on_click=lambda: check_weather(city_input.value)
                ).classes(
                    "w-full bg-primary text-white py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors"
                ).props("no-caps")

                # Results container
                results_container = ui.column().classes("w-full mt-6")

        async def check_weather(city_name: str):
            """Check weather and display trip recommendation."""
            if not city_name or not city_name.strip():
                ui.notify("Please enter a city name", type="warning")
                return

            city_name = city_name.strip()

            # Show loading state
            results_container.clear()
            with results_container:
                with ui.row().classes("w-full justify-center py-4"):
                    ui.spinner(size="lg", color="primary")
                    ui.label("Fetching weather data...").classes("ml-3 text-gray-600")

            try:
                # Get trip recommendation
                recommendation = await get_trip_recommendation(city_name)
                tomorrow = date.today() + timedelta(days=1)

                # Display results
                results_container.clear()
                with results_container:
                    # Weather info card
                    with ui.card().classes("w-full p-6 bg-gray-50 rounded-xl mb-4"):
                        ui.label(f"Weather for {city_name}").classes("text-xl font-bold text-gray-800 mb-2")
                        ui.label(f"Tomorrow ({tomorrow.strftime('%B %d, %Y')})").classes("text-sm text-gray-500 mb-4")

                        # Weather details
                        with ui.row().classes("w-full gap-4"):
                            # Temperature
                            with ui.column().classes("flex-1"):
                                ui.label("🌡️ Temperature").classes("text-sm font-medium text-gray-600 mb-1")
                                ui.label(f"{float(recommendation.temperature_celsius):.1f}°C").classes(
                                    "text-2xl font-bold text-gray-800"
                                )

                            # Precipitation
                            with ui.column().classes("flex-1"):
                                ui.label("🌧️ Precipitation").classes("text-sm font-medium text-gray-600 mb-1")
                                ui.label(f"{float(recommendation.precipitation_mm):.1f}mm").classes(
                                    "text-2xl font-bold text-gray-800"
                                )

                    # Recommendation card
                    recommendation_color = (
                        "bg-green-50 border-green-200" if recommendation.is_good_idea else "bg-red-50 border-red-200"
                    )
                    icon = "✅" if recommendation.is_good_idea else "❌"
                    decision = "GOOD IDEA" if recommendation.is_good_idea else "BAD IDEA"
                    decision_color = "text-green-600" if recommendation.is_good_idea else "text-red-600"

                    with ui.card().classes(f"w-full p-6 {recommendation_color} border-2 rounded-xl"):
                        with ui.row().classes("w-full items-center mb-4"):
                            ui.label(icon).classes("text-3xl")
                            ui.label(f"Trip is a {decision}").classes(f"text-xl font-bold {decision_color} ml-3")

                        ui.label(recommendation.reason).classes("text-gray-700 leading-relaxed")

                    # Trip criteria info
                    with ui.expansion("Trip Criteria", icon="info").classes("w-full mt-4"):
                        ui.label('A trip is considered a "good idea" when:').classes("font-medium mb-2")
                        with ui.column().classes("gap-1"):
                            ui.label("• Temperature between 10°C and 25°C").classes("text-sm text-gray-600")
                            ui.label("• No significant precipitation (less than 1mm)").classes("text-sm text-gray-600")

                ui.notify(f"Weather data loaded for {city_name}", type="positive")

            except CityNotFoundError:
                results_container.clear()
                with results_container:
                    with ui.card().classes("w-full p-6 bg-red-50 border-2 border-red-200 rounded-xl"):
                        ui.label("❌ City Not Found").classes("text-xl font-bold text-red-600 mb-2")
                        ui.label(
                            f'Could not find weather data for "{city_name}". Please check the spelling and try again.'
                        ).classes("text-red-700")

                ui.notify(f'City "{city_name}" not found', type="negative")

            except WeatherAPIError as e:
                results_container.clear()
                with results_container:
                    with ui.card().classes("w-full p-6 bg-red-50 border-2 border-red-200 rounded-xl"):
                        ui.label("⚠️ Service Error").classes("text-xl font-bold text-red-600 mb-2")
                        ui.label("Unable to fetch weather data at the moment. Please try again later.").classes(
                            "text-red-700"
                        )

                logger.error(f"Weather API error for {city_name}: {e}")
                ui.notify("Weather service unavailable", type="negative")

            except Exception as e:
                results_container.clear()
                with results_container:
                    with ui.card().classes("w-full p-6 bg-red-50 border-2 border-red-200 rounded-xl"):
                        ui.label("❌ Unexpected Error").classes("text-xl font-bold text-red-600 mb-2")
                        ui.label("An unexpected error occurred. Please try again.").classes("text-red-700")

                logger.error(f"Unexpected error checking weather for {city_name}: {e}")
                ui.notify("An unexpected error occurred", type="negative")

        # Handle Enter key press
        city_input.on("keydown.enter", lambda: check_weather(city_input.value))
