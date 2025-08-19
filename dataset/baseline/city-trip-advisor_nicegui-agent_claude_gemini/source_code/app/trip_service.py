"""Trip recommendation service based on weather forecasts."""

from datetime import date, timedelta
from app.models import TripRecommendation, WeatherForecast
from app.database import get_session
from app.weather_service import get_weather_for_tomorrow
from sqlmodel import select
import logging

logger = logging.getLogger(__name__)


def evaluate_trip_recommendation(forecast: WeatherForecast) -> tuple[bool, str]:
    """
    Evaluate whether a trip is a good idea based on weather conditions.

    Criteria for "good idea":
    - Temperature between 10°C and 25°C
    - No significant precipitation (less than 1mm)

    Returns:
        tuple: (is_good_idea, reason)
    """
    temp = float(forecast.temperature_celsius)
    precipitation = float(forecast.precipitation_mm)

    reasons = []
    is_good = True

    # Check temperature
    if temp < 10:
        reasons.append(f"Temperature too cold ({temp}°C)")
        is_good = False
    elif temp > 25:
        reasons.append(f"Temperature too hot ({temp}°C)")
        is_good = False
    else:
        reasons.append(f"Temperature is pleasant ({temp}°C)")

    # Check precipitation
    if precipitation >= 1.0:
        reasons.append(f"Significant precipitation expected ({precipitation}mm)")
        is_good = False
    elif precipitation > 0:
        reasons.append(f"Light precipitation possible ({precipitation}mm)")
    else:
        reasons.append("No precipitation expected")

    if is_good:
        reason = "Perfect weather conditions! " + ", ".join(reasons)
    else:
        reason = "Weather conditions not ideal: " + ", ".join(reasons)

    return is_good, reason


async def get_trip_recommendation(city_name: str) -> TripRecommendation:
    """Get trip recommendation for tomorrow based on weather forecast."""
    tomorrow = date.today() + timedelta(days=1)

    # Check if we have a cached recommendation
    with get_session() as session:
        cached_recommendation = session.exec(
            select(TripRecommendation).where(
                TripRecommendation.city_name == city_name, TripRecommendation.forecast_date == tomorrow
            )
        ).first()

        if cached_recommendation:
            logger.info(f"Using cached trip recommendation for {city_name}")
            return cached_recommendation

    # Get weather forecast
    forecast = await get_weather_for_tomorrow(city_name)

    # Evaluate recommendation
    is_good_idea, reason = evaluate_trip_recommendation(forecast)

    # Create and save recommendation
    recommendation = TripRecommendation(
        city_name=city_name,
        forecast_date=tomorrow,
        is_good_idea=is_good_idea,
        temperature_celsius=forecast.temperature_celsius,
        precipitation_mm=forecast.precipitation_mm,
        reason=reason,
    )

    with get_session() as session:
        session.add(recommendation)
        session.commit()
        session.refresh(recommendation)

    logger.info(f"Generated trip recommendation for {city_name}: {'Good' if is_good_idea else 'Bad'}")
    return recommendation


def clear_old_recommendations(days_to_keep: int = 7) -> None:
    """Clear trip recommendations older than specified days."""
    cutoff_date = date.today() - timedelta(days=days_to_keep)

    with get_session() as session:
        old_recommendations = session.exec(
            select(TripRecommendation).where(TripRecommendation.forecast_date < cutoff_date)
        ).all()

        for recommendation in old_recommendations:
            session.delete(recommendation)

        session.commit()
        logger.info(f"Cleared {len(old_recommendations)} old trip recommendations")
