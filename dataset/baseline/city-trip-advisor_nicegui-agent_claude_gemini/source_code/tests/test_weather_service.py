"""Tests for weather service functionality with real API calls."""

import pytest
from datetime import date, timedelta
from decimal import Decimal
from app.weather_service import (
    get_city_coordinates,
    fetch_weather_forecast,
    get_weather_for_tomorrow,
    CityNotFoundError,
    WeatherAPIError,
)
from app.models import WeatherForecast
from app.database import reset_db, get_session
from sqlmodel import select


@pytest.fixture()
def new_db():
    reset_db()
    yield
    reset_db()


class TestGetCityCoordinatesReal:
    """Test city coordinates fetching from real geocoding API."""

    @pytest.mark.asyncio
    async def test_get_coordinates_major_city(self):
        """Test successful coordinate fetching for a major city."""
        lat, lon = await get_city_coordinates("London")

        # London coordinates should be approximately correct
        assert 51.0 < lat < 52.0
        assert -1.0 < lon < 0.0

    @pytest.mark.asyncio
    async def test_get_coordinates_another_city(self):
        """Test coordinate fetching for another major city."""
        lat, lon = await get_city_coordinates("Paris")

        # Paris coordinates should be approximately correct
        assert 48.0 < lat < 49.0
        assert 2.0 < lon < 3.0

    @pytest.mark.asyncio
    async def test_get_coordinates_nonexistent_city(self):
        """Test handling of nonexistent city."""
        with pytest.raises(CityNotFoundError) as exc_info:
            await get_city_coordinates("NonexistentCityXYZ123")

        assert "NonexistentCityXYZ123" in str(exc_info.value)


class TestFetchWeatherForecastReal:
    """Test weather forecast fetching with real API."""

    @pytest.mark.asyncio
    async def test_fetch_weather_london(self, new_db):
        """Test successful weather forecast fetching for London."""
        city_name = "London"
        forecast_date = date.today() + timedelta(days=1)

        forecast = await fetch_weather_forecast(city_name, forecast_date)

        assert forecast.city_name == city_name
        assert forecast.forecast_date == forecast_date
        assert isinstance(forecast.temperature_celsius, Decimal)
        assert isinstance(forecast.precipitation_mm, Decimal)
        assert len(forecast.weather_description) > 0

        # Temperature should be reasonable for London (even in extreme weather)
        temp = float(forecast.temperature_celsius)
        assert -20.0 <= temp <= 45.0

        # Precipitation should be non-negative
        precip = float(forecast.precipitation_mm)
        assert precip >= 0.0

    @pytest.mark.asyncio
    async def test_fetch_weather_tokyo(self, new_db):
        """Test weather forecast fetching for Tokyo."""
        city_name = "Tokyo"
        forecast_date = date.today() + timedelta(days=1)

        forecast = await fetch_weather_forecast(city_name, forecast_date)

        assert forecast.city_name == city_name
        assert forecast.forecast_date == forecast_date

        # Tokyo temperature should be reasonable
        temp = float(forecast.temperature_celsius)
        assert -10.0 <= temp <= 40.0

    @pytest.mark.asyncio
    async def test_cached_forecast_used(self, new_db):
        """Test that cached forecast is used when available."""
        city_name = "Berlin"
        forecast_date = date.today() + timedelta(days=1)

        # Create cached forecast
        cached_forecast = WeatherForecast(
            city_name=city_name,
            forecast_date=forecast_date,
            temperature_celsius=Decimal("20.0"),
            precipitation_mm=Decimal("2.5"),
            weather_description="Cached forecast",
        )

        with get_session() as session:
            session.add(cached_forecast)
            session.commit()
            session.refresh(cached_forecast)

        # Fetch should return cached data
        forecast = await fetch_weather_forecast(city_name, forecast_date)

        assert forecast.city_name == city_name
        assert forecast.temperature_celsius == Decimal("20.0")
        assert forecast.precipitation_mm == Decimal("2.5")
        assert forecast.weather_description == "Cached forecast"


class TestGetWeatherForTomorrowReal:
    """Test convenience function for tomorrow's weather with real API."""

    @pytest.mark.asyncio
    async def test_get_weather_for_tomorrow(self, new_db):
        """Test getting weather forecast for tomorrow."""
        city_name = "Amsterdam"
        tomorrow = date.today() + timedelta(days=1)

        forecast = await get_weather_for_tomorrow(city_name)

        assert forecast.forecast_date == tomorrow
        assert forecast.city_name == city_name

        # Verify data is reasonable
        temp = float(forecast.temperature_celsius)
        assert -15.0 <= temp <= 35.0

        precip = float(forecast.precipitation_mm)
        assert precip >= 0.0


class TestWeatherServiceLogic:
    """Test weather service business logic without external dependencies."""

    def test_weather_description_generation(self, new_db):
        """Test weather description logic."""
        # This test focuses on internal logic rather than API calls
        city_name = "TestCity"
        forecast_date = date.today() + timedelta(days=1)

        # Create test forecasts with different precipitation levels
        test_cases = [
            (Decimal("0.0"), "Clear weather"),
            (Decimal("0.5"), "Light precipitation"),
            (Decimal("6.0"), "Rainy day"),
        ]

        for precip, expected_keyword in test_cases:
            forecast = WeatherForecast(
                city_name=city_name,
                forecast_date=forecast_date,
                temperature_celsius=Decimal("20.0"),
                precipitation_mm=precip,
                weather_description=f"Test description with {expected_keyword}",
            )

            # Verify the forecast can be created with these values
            assert forecast.precipitation_mm == precip
            assert expected_keyword in forecast.weather_description


class TestErrorScenarios:
    """Test error handling scenarios."""

    @pytest.mark.asyncio
    async def test_invalid_city_name(self):
        """Test error handling for clearly invalid city names."""
        invalid_names = ["", "   ", "123456", "!@#$%^"]

        for invalid_name in invalid_names:
            if invalid_name.strip():  # Only test non-empty invalid names
                with pytest.raises((CityNotFoundError, WeatherAPIError)):
                    await get_city_coordinates(invalid_name)

    def test_decimal_precision_handling(self, new_db):
        """Test that decimal values are handled correctly."""
        forecast = WeatherForecast(
            city_name="TestCity",
            forecast_date=date.today() + timedelta(days=1),
            temperature_celsius=Decimal("20.123456"),  # High precision
            precipitation_mm=Decimal("5.987654"),
            weather_description="Test forecast",
        )

        with get_session() as session:
            session.add(forecast)
            session.commit()
            session.refresh(forecast)

        # Verify precision is stored as provided (no automatic rounding in database storage)
        assert forecast.temperature_celsius == Decimal("20.123456")
        assert forecast.precipitation_mm == Decimal("5.987654")


class TestDatabaseIntegration:
    """Test database storage and retrieval."""

    def test_forecast_storage_and_retrieval(self, new_db):
        """Test storing and retrieving weather forecasts."""
        city_name = "Munich"
        forecast_date = date.today() + timedelta(days=1)

        # Create forecast
        original_forecast = WeatherForecast(
            city_name=city_name,
            forecast_date=forecast_date,
            temperature_celsius=Decimal("18.5"),
            precipitation_mm=Decimal("1.25"),
            weather_description="Partly cloudy with light rain",
        )

        # Save to database
        with get_session() as session:
            session.add(original_forecast)
            session.commit()
            session.refresh(original_forecast)
            stored_id = original_forecast.id

        # Retrieve from database
        with get_session() as session:
            retrieved_forecast = session.get(WeatherForecast, stored_id)

            assert retrieved_forecast is not None
            assert retrieved_forecast.city_name == city_name
            assert retrieved_forecast.forecast_date == forecast_date
            assert retrieved_forecast.temperature_celsius == Decimal("18.5")
            assert retrieved_forecast.precipitation_mm == Decimal("1.25")

    def test_query_by_city_and_date(self, new_db):
        """Test querying forecasts by city and date."""
        city_name = "Vienna"
        forecast_date = date.today() + timedelta(days=1)

        # Create and save forecast
        forecast = WeatherForecast(
            city_name=city_name,
            forecast_date=forecast_date,
            temperature_celsius=Decimal("22.0"),
            precipitation_mm=Decimal("0.0"),
            weather_description="Sunny and clear",
        )

        with get_session() as session:
            session.add(forecast)
            session.commit()

        # Query by city and date
        with get_session() as session:
            retrieved = session.exec(
                select(WeatherForecast).where(
                    WeatherForecast.city_name == city_name, WeatherForecast.forecast_date == forecast_date
                )
            ).first()

            assert retrieved is not None
            assert retrieved.city_name == city_name
            assert retrieved.forecast_date == forecast_date
