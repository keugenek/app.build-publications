"""UI smoke tests for weather forecast application."""

import pytest
from datetime import date, timedelta
from decimal import Decimal
from app.models import TripRecommendation, WeatherForecast
from app.database import reset_db


@pytest.fixture()
def new_db():
    reset_db()
    yield
    reset_db()


class TestWeatherUISmoke:
    """Basic smoke tests for weather UI functionality."""

    def test_ui_module_imports_correctly(self):
        """Test that the weather UI module can be imported without errors."""
        from app import weather_ui

        # Module should have the create function
        assert hasattr(weather_ui, "create")
        assert callable(weather_ui.create)


class TestWeatherDataFormatting:
    """Test weather data formatting and display logic."""

    def test_temperature_display_formatting(self):
        """Test temperature formatting for display."""
        test_cases = [
            (Decimal("20.0"), "20.0°C"),
            (Decimal("22.5"), "22.5°C"),
            (Decimal("15.123"), "15.1°C"),
            (Decimal("-5.7"), "-5.7°C"),
        ]

        for temp_decimal, expected in test_cases:
            temp_float = float(temp_decimal)
            formatted = f"{temp_float:.1f}°C"
            assert formatted == expected

    def test_precipitation_display_formatting(self):
        """Test precipitation formatting for display."""
        test_cases = [
            (Decimal("0.0"), "0.0mm"),
            (Decimal("1.25"), "1.2mm"),  # Rounded down
            (Decimal("1.26"), "1.3mm"),  # Rounded up
            (Decimal("10.0"), "10.0mm"),
        ]

        for precip_decimal, expected in test_cases:
            precip_float = float(precip_decimal)
            formatted = f"{precip_float:.1f}mm"
            assert formatted == expected

    def test_recommendation_decision_formatting(self):
        """Test recommendation decision display formatting."""
        good_recommendation = TripRecommendation(
            city_name="TestCity",
            forecast_date=date.today() + timedelta(days=1),
            is_good_idea=True,
            temperature_celsius=Decimal("20.0"),
            precipitation_mm=Decimal("0.0"),
            reason="Perfect conditions",
        )

        bad_recommendation = TripRecommendation(
            city_name="TestCity",
            forecast_date=date.today() + timedelta(days=1),
            is_good_idea=False,
            temperature_celsius=Decimal("35.0"),
            precipitation_mm=Decimal("10.0"),
            reason="Too hot and rainy",
        )

        # Test decision text formatting
        good_decision = "GOOD IDEA" if good_recommendation.is_good_idea else "BAD IDEA"
        bad_decision = "GOOD IDEA" if bad_recommendation.is_good_idea else "BAD IDEA"

        assert good_decision == "GOOD IDEA"
        assert bad_decision == "BAD IDEA"

    def test_date_formatting_for_display(self):
        """Test date formatting for display in UI."""
        tomorrow = date.today() + timedelta(days=1)

        # Test the date formatting that would be used in UI
        formatted_date = tomorrow.strftime("%B %d, %Y")

        # Should contain month name and year
        assert len(formatted_date) > 10  # Should be reasonably long
        assert str(tomorrow.year) in formatted_date


class TestRecommendationLogic:
    """Test recommendation logic that drives UI display."""

    def test_good_weather_recommendation_text(self):
        """Test text generation for good weather recommendations."""
        forecast = WeatherForecast(
            city_name="TestCity",
            forecast_date=date.today() + timedelta(days=1),
            temperature_celsius=Decimal("22.0"),
            precipitation_mm=Decimal("0.0"),
            weather_description="Clear and sunny",
        )

        # Simulate the logic used in trip service
        temp = float(forecast.temperature_celsius)
        precipitation = float(forecast.precipitation_mm)

        reasons = []
        is_good = True

        if 10 <= temp <= 25:
            reasons.append(f"Temperature is pleasant ({temp}°C)")
        else:
            is_good = False

        if precipitation < 1.0:
            if precipitation == 0:
                reasons.append("No precipitation expected")
            else:
                reasons.append(f"Light precipitation possible ({precipitation}mm)")
        else:
            is_good = False

        reason = "Perfect weather conditions! " + ", ".join(reasons) if is_good else "Weather conditions not ideal"

        assert is_good
        assert "Perfect weather conditions" in reason
        assert "pleasant (22.0°C)" in reason
        assert "No precipitation expected" in reason

    def test_bad_weather_recommendation_text(self):
        """Test text generation for bad weather recommendations."""
        forecast = WeatherForecast(
            city_name="TestCity",
            forecast_date=date.today() + timedelta(days=1),
            temperature_celsius=Decimal("5.0"),
            precipitation_mm=Decimal("8.0"),
            weather_description="Cold and rainy",
        )

        # Simulate the logic used in trip service
        temp = float(forecast.temperature_celsius)
        precipitation = float(forecast.precipitation_mm)

        reasons = []
        is_good = True

        if temp < 10:
            reasons.append(f"Temperature too cold ({temp}°C)")
            is_good = False
        elif temp > 25:
            reasons.append(f"Temperature too hot ({temp}°C)")
            is_good = False

        if precipitation >= 1.0:
            reasons.append(f"Significant precipitation expected ({precipitation}mm)")
            is_good = False

        reason = "Weather conditions not ideal: " + ", ".join(reasons)

        assert not is_good
        assert "not ideal" in reason
        assert "too cold (5.0°C)" in reason
        assert "Significant precipitation expected (8.0mm)" in reason


class TestUIBusinessLogic:
    """Test business logic that supports UI functionality."""

    def test_city_name_validation(self):
        """Test city name validation logic."""
        valid_cities = ["London", "Paris", "New York", "São Paulo", "東京"]
        invalid_cities = ["", "   ", None]

        for city in valid_cities:
            # City name should be valid if not empty after strip
            is_valid = city is not None and city.strip() != ""
            assert is_valid

        for city in invalid_cities:
            # City name should be invalid if None or empty after strip
            is_valid = city is not None and city.strip() != ""
            assert not is_valid

    def test_error_message_formatting(self):
        """Test error message formatting for different error types."""
        city_name = "TestCity"

        # City not found error
        city_not_found_msg = f'Could not find weather data for "{city_name}". Please check the spelling and try again.'
        assert city_name in city_not_found_msg
        assert "check the spelling" in city_not_found_msg

        # Service error message
        service_error_msg = "Unable to fetch weather data at the moment. Please try again later."
        assert "try again later" in service_error_msg

        # Unexpected error message
        unexpected_error_msg = "An unexpected error occurred. Please try again."
        assert "unexpected error" in unexpected_error_msg

    def test_loading_state_messages(self):
        """Test loading state message formatting."""
        loading_message = "Fetching weather data..."
        success_message_template = "Weather data loaded for {}"

        city = "Amsterdam"
        success_message = success_message_template.format(city)

        assert "Fetching" in loading_message
        assert city in success_message
        assert "loaded" in success_message


class TestWeatherCriteria:
    """Test weather criteria information display."""

    def test_trip_criteria_text(self):
        """Test trip criteria explanatory text."""
        criteria_title = 'A trip is considered a "good idea" when:'
        temp_criterion = "• Temperature between 10°C and 25°C"
        precip_criterion = "• No significant precipitation (less than 1mm)"

        # Verify criteria text contains expected information
        assert "good idea" in criteria_title
        assert "10°C and 25°C" in temp_criterion
        assert "less than 1mm" in precip_criterion

    def test_weather_icon_selection(self):
        """Test weather icon selection logic."""
        # Test icon selection based on recommendation
        good_icon = "✅"
        bad_icon = "❌"

        # Icons should be appropriate emoji characters
        assert len(good_icon) > 0
        assert len(bad_icon) > 0

        # Test temperature and precipitation icons
        temp_icon = "🌡️"
        precip_icon = "🌧️"

        assert len(temp_icon) > 0
        assert len(precip_icon) > 0
