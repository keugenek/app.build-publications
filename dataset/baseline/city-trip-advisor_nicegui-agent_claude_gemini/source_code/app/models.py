from sqlmodel import SQLModel, Field
from datetime import datetime, date
from typing import Optional
from decimal import Decimal


# Persistent models (stored in database)
class WeatherForecast(SQLModel, table=True):
    """Weather forecast data for a specific city and date."""

    __tablename__ = "weather_forecasts"  # type: ignore[assignment]

    id: Optional[int] = Field(default=None, primary_key=True)
    city_name: str = Field(max_length=100, index=True)
    forecast_date: date = Field(index=True)
    temperature_celsius: Decimal = Field(decimal_places=1)
    precipitation_mm: Decimal = Field(decimal_places=2, default=Decimal("0.0"))
    weather_description: str = Field(max_length=200, default="")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class TripRecommendation(SQLModel, table=True):
    """Trip recommendation based on weather forecast."""

    __tablename__ = "trip_recommendations"  # type: ignore[assignment]

    id: Optional[int] = Field(default=None, primary_key=True)
    city_name: str = Field(max_length=100, index=True)
    forecast_date: date = Field(index=True)
    is_good_idea: bool = Field(default=False)
    temperature_celsius: Decimal = Field(decimal_places=1)
    precipitation_mm: Decimal = Field(decimal_places=2)
    reason: str = Field(max_length=500, default="")
    created_at: datetime = Field(default_factory=datetime.utcnow)


# Non-persistent schemas (for validation, forms, API requests/responses)
class WeatherRequest(SQLModel, table=False):
    """Request schema for weather forecast lookup."""

    city_name: str = Field(min_length=1, max_length=100)


class WeatherForecastResponse(SQLModel, table=False):
    """Response schema for weather forecast data."""

    city_name: str
    forecast_date: str  # ISO format date string
    temperature_celsius: float
    precipitation_mm: float
    weather_description: str


class TripRecommendationResponse(SQLModel, table=False):
    """Response schema for trip recommendation."""

    city_name: str
    forecast_date: str  # ISO format date string
    is_good_idea: bool
    temperature_celsius: float
    precipitation_mm: float
    reason: str
    weather_forecast: WeatherForecastResponse


class WeatherApiResponse(SQLModel, table=False):
    """Schema for Open-Meteo API response data."""

    temperature_2m: list[float]
    precipitation: list[float]
    time: list[str]


class GeocodingResponse(SQLModel, table=False):
    """Schema for geocoding API response to get city coordinates."""

    name: str
    latitude: float
    longitude: float
    country: str
