"""Tests for trip recommendation service with real data."""

import pytest
from datetime import date, timedelta
from decimal import Decimal
from app.trip_service import evaluate_trip_recommendation, get_trip_recommendation, clear_old_recommendations
from app.models import WeatherForecast, TripRecommendation
from app.database import reset_db, get_session
from sqlmodel import select


@pytest.fixture()
def new_db():
    reset_db()
    yield
    reset_db()


class TestEvaluateTripRecommendation:
    """Test trip recommendation evaluation logic."""

    def test_perfect_weather_conditions(self):
        """Test recommendation for ideal weather conditions."""
        forecast = WeatherForecast(
            city_name="TestCity",
            forecast_date=date.today() + timedelta(days=1),
            temperature_celsius=Decimal("20.0"),
            precipitation_mm=Decimal("0.0"),
            weather_description="Clear weather",
        )

        is_good, reason = evaluate_trip_recommendation(forecast)

        assert is_good
        assert "Perfect weather conditions" in reason
        assert "20.0°C" in reason
        assert "No precipitation expected" in reason

    def test_temperature_too_cold(self):
        """Test recommendation for cold temperature."""
        forecast = WeatherForecast(
            city_name="TestCity",
            forecast_date=date.today() + timedelta(days=1),
            temperature_celsius=Decimal("5.0"),
            precipitation_mm=Decimal("0.0"),
            weather_description="Cold and clear",
        )

        is_good, reason = evaluate_trip_recommendation(forecast)

        assert not is_good
        assert "Temperature too cold (5.0°C)" in reason
        assert "Weather conditions not ideal" in reason

    def test_temperature_too_hot(self):
        """Test recommendation for hot temperature."""
        forecast = WeatherForecast(
            city_name="TestCity",
            forecast_date=date.today() + timedelta(days=1),
            temperature_celsius=Decimal("30.0"),
            precipitation_mm=Decimal("0.0"),
            weather_description="Hot and sunny",
        )

        is_good, reason = evaluate_trip_recommendation(forecast)

        assert not is_good
        assert "Temperature too hot (30.0°C)" in reason

    def test_significant_precipitation(self):
        """Test recommendation with significant rain."""
        forecast = WeatherForecast(
            city_name="TestCity",
            forecast_date=date.today() + timedelta(days=1),
            temperature_celsius=Decimal("18.0"),
            precipitation_mm=Decimal("5.5"),
            weather_description="Rainy day",
        )

        is_good, reason = evaluate_trip_recommendation(forecast)

        assert not is_good
        assert "Significant precipitation expected (5.5mm)" in reason
        assert "pleasant (18.0°C)" in reason  # Temperature is good

    def test_light_precipitation_acceptable(self):
        """Test that light precipitation doesn't make trip bad."""
        forecast = WeatherForecast(
            city_name="TestCity",
            forecast_date=date.today() + timedelta(days=1),
            temperature_celsius=Decimal("22.0"),
            precipitation_mm=Decimal("0.5"),
            weather_description="Light drizzle",
        )

        is_good, reason = evaluate_trip_recommendation(forecast)

        assert is_good
        assert "Perfect weather conditions" in reason
        assert "Light precipitation possible (0.5mm)" in reason

    def test_temperature_boundary_conditions(self):
        """Test temperature boundary conditions."""
        # Test exactly 10°C (should be good)
        forecast_10 = WeatherForecast(
            city_name="TestCity",
            forecast_date=date.today() + timedelta(days=1),
            temperature_celsius=Decimal("10.0"),
            precipitation_mm=Decimal("0.0"),
            weather_description="Cool but clear",
        )

        is_good, reason = evaluate_trip_recommendation(forecast_10)
        assert is_good
        assert "pleasant (10.0°C)" in reason

        # Test exactly 25°C (should be good)
        forecast_25 = WeatherForecast(
            city_name="TestCity",
            forecast_date=date.today() + timedelta(days=1),
            temperature_celsius=Decimal("25.0"),
            precipitation_mm=Decimal("0.0"),
            weather_description="Warm but clear",
        )

        is_good, reason = evaluate_trip_recommendation(forecast_25)
        assert is_good
        assert "pleasant (25.0°C)" in reason

        # Test 9.9°C (should be bad)
        forecast_cold = WeatherForecast(
            city_name="TestCity",
            forecast_date=date.today() + timedelta(days=1),
            temperature_celsius=Decimal("9.9"),
            precipitation_mm=Decimal("0.0"),
            weather_description="Just too cold",
        )

        is_good, reason = evaluate_trip_recommendation(forecast_cold)
        assert not is_good
        assert "too cold (9.9°C)" in reason

        # Test 25.1°C (should be bad)
        forecast_hot = WeatherForecast(
            city_name="TestCity",
            forecast_date=date.today() + timedelta(days=1),
            temperature_celsius=Decimal("25.1"),
            precipitation_mm=Decimal("0.0"),
            weather_description="Just too hot",
        )

        is_good, reason = evaluate_trip_recommendation(forecast_hot)
        assert not is_good
        assert "too hot (25.1°C)" in reason

    def test_precipitation_boundary_conditions(self):
        """Test precipitation boundary conditions."""
        # Test exactly 1.0mm precipitation (should be bad)
        forecast_1mm = WeatherForecast(
            city_name="TestCity",
            forecast_date=date.today() + timedelta(days=1),
            temperature_celsius=Decimal("20.0"),
            precipitation_mm=Decimal("1.0"),
            weather_description="Light rain",
        )

        is_good, reason = evaluate_trip_recommendation(forecast_1mm)
        assert not is_good
        assert "Significant precipitation expected (1.0mm)" in reason

        # Test 0.9mm precipitation (should be good)
        forecast_light = WeatherForecast(
            city_name="TestCity",
            forecast_date=date.today() + timedelta(days=1),
            temperature_celsius=Decimal("20.0"),
            precipitation_mm=Decimal("0.9"),
            weather_description="Very light drizzle",
        )

        is_good, reason = evaluate_trip_recommendation(forecast_light)
        assert is_good
        assert "Light precipitation possible (0.9mm)" in reason

    def test_multiple_negative_conditions(self):
        """Test recommendation with both temperature and precipitation issues."""
        forecast = WeatherForecast(
            city_name="TestCity",
            forecast_date=date.today() + timedelta(days=1),
            temperature_celsius=Decimal("8.0"),
            precipitation_mm=Decimal("3.0"),
            weather_description="Cold and rainy",
        )

        is_good, reason = evaluate_trip_recommendation(forecast)

        assert not is_good
        assert "Temperature too cold (8.0°C)" in reason
        assert "Significant precipitation expected (3.0mm)" in reason
        assert "Weather conditions not ideal" in reason


class TestGetTripRecommendationReal:
    """Test trip recommendation with real weather API integration."""

    @pytest.mark.asyncio
    async def test_get_recommendation_london(self, new_db):
        """Test trip recommendation for London with real weather data."""
        city_name = "London"
        tomorrow = date.today() + timedelta(days=1)

        recommendation = await get_trip_recommendation(city_name)

        assert recommendation.city_name == city_name
        assert recommendation.forecast_date == tomorrow
        assert isinstance(recommendation.is_good_idea, bool)
        assert isinstance(recommendation.temperature_celsius, Decimal)
        assert isinstance(recommendation.precipitation_mm, Decimal)
        assert len(recommendation.reason) > 0

        # Verify it's saved to database
        with get_session() as session:
            saved_rec = session.exec(
                select(TripRecommendation).where(
                    TripRecommendation.city_name == city_name, TripRecommendation.forecast_date == tomorrow
                )
            ).first()

            assert saved_rec is not None
            assert saved_rec.city_name == city_name
            assert saved_rec.is_good_idea == recommendation.is_good_idea

    @pytest.mark.asyncio
    async def test_get_recommendation_paris(self, new_db):
        """Test trip recommendation for Paris."""
        city_name = "Paris"

        recommendation = await get_trip_recommendation(city_name)

        assert recommendation.city_name == city_name

        # Temperature should be reasonable for Paris
        temp = float(recommendation.temperature_celsius)
        assert -10.0 <= temp <= 40.0

        # Precipitation should be non-negative
        precip = float(recommendation.precipitation_mm)
        assert precip >= 0.0

        # Reason should explain the decision
        if recommendation.is_good_idea:
            assert "Perfect weather conditions" in recommendation.reason or "pleasant" in recommendation.reason.lower()
        else:
            assert "not ideal" in recommendation.reason.lower() or "too" in recommendation.reason.lower()

    @pytest.mark.asyncio
    async def test_cached_recommendation_used(self, new_db):
        """Test that cached recommendation is returned when available."""
        city_name = "Vienna"
        tomorrow = date.today() + timedelta(days=1)

        # Create cached recommendation
        cached_rec = TripRecommendation(
            city_name=city_name,
            forecast_date=tomorrow,
            is_good_idea=False,
            temperature_celsius=Decimal("5.0"),
            precipitation_mm=Decimal("8.0"),
            reason="Too cold and rainy (cached)",
        )

        with get_session() as session:
            session.add(cached_rec)
            session.commit()
            session.refresh(cached_rec)

        # Should return cached recommendation
        recommendation = await get_trip_recommendation(city_name)

        assert recommendation.city_name == city_name
        assert not recommendation.is_good_idea
        assert "cached" in recommendation.reason


class TestClearOldRecommendations:
    """Test cleanup of old recommendations."""

    def test_clear_old_recommendations_default(self, new_db):
        """Test removal of old trip recommendations with default settings."""
        today = date.today()

        # Create recommendations of different ages
        recommendations = [
            TripRecommendation(
                city_name="OldCity",
                forecast_date=today - timedelta(days=10),  # Very old
                is_good_idea=True,
                temperature_celsius=Decimal("20.0"),
                precipitation_mm=Decimal("0.0"),
                reason="Good weather",
            ),
            TripRecommendation(
                city_name="RecentCity",
                forecast_date=today - timedelta(days=5),  # Recent
                is_good_idea=False,
                temperature_celsius=Decimal("8.0"),
                precipitation_mm=Decimal("5.0"),
                reason="Bad weather",
            ),
            TripRecommendation(
                city_name="FutureCity",
                forecast_date=today + timedelta(days=1),  # Future
                is_good_idea=True,
                temperature_celsius=Decimal("22.0"),
                precipitation_mm=Decimal("0.1"),
                reason="Perfect weather",
            ),
        ]

        with get_session() as session:
            for rec in recommendations:
                session.add(rec)
            session.commit()

        # Clear recommendations older than 7 days (default)
        clear_old_recommendations()

        # Check what remains
        with get_session() as session:
            remaining = session.exec(select(TripRecommendation)).all()

            assert len(remaining) == 2  # Only recent and future should remain
            remaining_cities = [rec.city_name for rec in remaining]
            assert "OldCity" not in remaining_cities  # Old one removed
            assert "RecentCity" in remaining_cities  # Recent one kept
            assert "FutureCity" in remaining_cities  # Future one kept

    def test_clear_old_recommendations_custom_days(self, new_db):
        """Test clearing with custom days to keep."""
        today = date.today()

        recommendations = [
            TripRecommendation(
                city_name="City4Days",
                forecast_date=today - timedelta(days=4),
                is_good_idea=True,
                temperature_celsius=Decimal("20.0"),
                precipitation_mm=Decimal("0.0"),
                reason="Good weather",
            ),
            TripRecommendation(
                city_name="City2Days",
                forecast_date=today - timedelta(days=2),
                is_good_idea=True,
                temperature_celsius=Decimal("18.0"),
                precipitation_mm=Decimal("0.5"),
                reason="Decent weather",
            ),
        ]

        with get_session() as session:
            for rec in recommendations:
                session.add(rec)
            session.commit()

        # Clear with 3 days to keep (should remove City4Days)
        clear_old_recommendations(days_to_keep=3)

        with get_session() as session:
            remaining = session.exec(select(TripRecommendation)).all()

            assert len(remaining) == 1
            assert remaining[0].city_name == "City2Days"

    def test_clear_recommendations_empty_database(self, new_db):
        """Test clearing recommendations when database is empty."""
        # Should not raise any errors
        clear_old_recommendations()

        with get_session() as session:
            remaining = session.exec(select(TripRecommendation)).all()
            assert len(remaining) == 0


class TestRecommendationLogic:
    """Test recommendation decision logic."""

    def test_recommendation_consistency(self):
        """Test that same weather conditions produce consistent recommendations."""
        forecast1 = WeatherForecast(
            city_name="City1",
            forecast_date=date.today() + timedelta(days=1),
            temperature_celsius=Decimal("15.0"),
            precipitation_mm=Decimal("0.3"),
            weather_description="Partly cloudy",
        )

        forecast2 = WeatherForecast(
            city_name="City2",
            forecast_date=date.today() + timedelta(days=2),
            temperature_celsius=Decimal("15.0"),
            precipitation_mm=Decimal("0.3"),
            weather_description="Partly cloudy",
        )

        result1 = evaluate_trip_recommendation(forecast1)
        result2 = evaluate_trip_recommendation(forecast2)

        # Same weather conditions should produce same recommendation
        assert result1[0] == result2[0]  # Same is_good_idea

    def test_extreme_weather_conditions(self):
        """Test recommendations for extreme weather conditions."""
        extreme_cases = [
            # Extremely cold
            (Decimal("-10.0"), Decimal("0.0"), False, "too cold"),
            # Extremely hot
            (Decimal("40.0"), Decimal("0.0"), False, "too hot"),
            # Heavy rain
            (Decimal("20.0"), Decimal("50.0"), False, "Significant precipitation"),
            # Perfect conditions
            (Decimal("22.0"), Decimal("0.0"), True, "Perfect weather"),
        ]

        for temp, precip, expected_good, expected_text in extreme_cases:
            forecast = WeatherForecast(
                city_name="TestCity",
                forecast_date=date.today() + timedelta(days=1),
                temperature_celsius=temp,
                precipitation_mm=precip,
                weather_description="Test weather",
            )

            is_good, reason = evaluate_trip_recommendation(forecast)

            assert is_good == expected_good, f"Failed for temp={temp}, precip={precip}"
            assert expected_text in reason, f"Reason '{reason}' doesn't contain '{expected_text}'"
