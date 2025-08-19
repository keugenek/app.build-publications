"""Weather service for fetching forecast data from Open-Meteo API."""

import httpx
from datetime import date, timedelta
from decimal import Decimal
from app.models import WeatherForecast, GeocodingResponse
from app.database import get_session
from sqlmodel import select
import logging

logger = logging.getLogger(__name__)


class WeatherServiceError(Exception):
    """Base exception for weather service errors."""

    pass


class CityNotFoundError(WeatherServiceError):
    """Raised when city coordinates cannot be found."""

    pass


class WeatherAPIError(WeatherServiceError):
    """Raised when weather API request fails."""

    pass


async def get_city_coordinates(city_name: str) -> tuple[float, float]:
    """Get latitude and longitude for a city using Open-Meteo geocoding API."""
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                "https://geocoding-api.open-meteo.com/v1/search",
                params={"name": city_name, "count": 1, "language": "en", "format": "json"},
                timeout=10.0,
            )
            response.raise_for_status()

            data = response.json()
            if not data.get("results"):
                raise CityNotFoundError(f"City '{city_name}' not found")

            result = data["results"][0]
            geo_response = GeocodingResponse(**result)
            return geo_response.latitude, geo_response.longitude

        except httpx.RequestError as e:
            logger.error(f"Geocoding API request failed for {city_name}: {e}")
            raise WeatherAPIError(f"Failed to get city coordinates: {str(e)}")
        except httpx.HTTPStatusError as e:
            logger.error(f"Geocoding API HTTP error for {city_name}: {e}")
            raise WeatherAPIError(f"Geocoding service error: {str(e)}")


async def fetch_weather_forecast(city_name: str, forecast_date: date) -> WeatherForecast:
    """Fetch weather forecast for a city and date from Open-Meteo API."""
    # Check if we have cached data first
    with get_session() as session:
        cached_forecast = session.exec(
            select(WeatherForecast).where(
                WeatherForecast.city_name == city_name, WeatherForecast.forecast_date == forecast_date
            )
        ).first()

        if cached_forecast:
            logger.info(f"Using cached weather data for {city_name} on {forecast_date}")
            return cached_forecast

    # Fetch from API
    latitude, longitude = await get_city_coordinates(city_name)

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                "https://api.open-meteo.com/v1/forecast",
                params={
                    "latitude": latitude,
                    "longitude": longitude,
                    "daily": "temperature_2m_max,temperature_2m_min,precipitation_sum",
                    "timezone": "auto",
                    "start_date": forecast_date.isoformat(),
                    "end_date": forecast_date.isoformat(),
                },
                timeout=10.0,
            )
            response.raise_for_status()

            data = response.json()
            daily_data = data.get("daily", {})

            if not daily_data.get("time"):
                raise WeatherAPIError("No weather data available for the requested date")

            # Extract weather data for the specific date
            temp_max = daily_data["temperature_2m_max"][0] if daily_data.get("temperature_2m_max") else 20.0
            temp_min = daily_data["temperature_2m_min"][0] if daily_data.get("temperature_2m_min") else 10.0
            precipitation = daily_data["precipitation_sum"][0] if daily_data.get("precipitation_sum") else 0.0

            # Calculate average temperature
            avg_temperature = (temp_max + temp_min) / 2

            # Create weather description
            if precipitation > 5.0:
                weather_desc = f"Rainy day with {precipitation:.1f}mm precipitation"
            elif precipitation > 0.0:
                weather_desc = f"Light precipitation ({precipitation:.1f}mm)"
            else:
                weather_desc = "Clear weather"

            # Create and save forecast
            forecast = WeatherForecast(
                city_name=city_name,
                forecast_date=forecast_date,
                temperature_celsius=Decimal(str(round(avg_temperature, 1))),
                precipitation_mm=Decimal(str(round(precipitation, 2))),
                weather_description=weather_desc,
            )

            with get_session() as session:
                session.add(forecast)
                session.commit()
                session.refresh(forecast)

            logger.info(f"Fetched weather data for {city_name} on {forecast_date}")
            return forecast

        except httpx.RequestError as e:
            logger.error(f"Weather API request failed for {city_name}: {e}")
            raise WeatherAPIError(f"Failed to fetch weather data: {str(e)}")
        except httpx.HTTPStatusError as e:
            logger.error(f"Weather API HTTP error for {city_name}: {e}")
            raise WeatherAPIError(f"Weather service error: {str(e)}")


async def get_weather_for_tomorrow(city_name: str) -> WeatherForecast:
    """Get weather forecast for tomorrow for a given city."""
    tomorrow = date.today() + timedelta(days=1)
    return await fetch_weather_forecast(city_name, tomorrow)
