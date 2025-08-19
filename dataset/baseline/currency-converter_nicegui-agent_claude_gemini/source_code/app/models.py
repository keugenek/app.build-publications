from sqlmodel import SQLModel, Field, Column, JSON
from datetime import datetime
from decimal import Decimal
from typing import Optional, Dict, Any


class Currency(SQLModel, table=True):
    """Currency reference model for validation and display."""

    __tablename__ = "currencies"  # type: ignore[assignment]

    id: Optional[int] = Field(default=None, primary_key=True)
    code: str = Field(unique=True, max_length=3, description="ISO 4217 currency code (e.g., EUR, USD)")
    name: str = Field(max_length=100, description="Full currency name")
    symbol: str = Field(max_length=10, description="Currency symbol")
    is_active: bool = Field(default=True, description="Whether this currency is available for conversion")
    created_at: datetime = Field(default_factory=datetime.utcnow)


class ConversionRequest(SQLModel, table=True):
    """Stores currency conversion requests for history and analytics."""

    __tablename__ = "conversion_requests"  # type: ignore[assignment]

    id: Optional[int] = Field(default=None, primary_key=True)
    amount: Decimal = Field(description="Amount to convert", decimal_places=2)
    source_currency: str = Field(max_length=3, description="Source currency code")
    target_currency: str = Field(max_length=3, description="Target currency code")
    exchange_rate: Optional[Decimal] = Field(default=None, description="Exchange rate used", decimal_places=6)
    converted_amount: Optional[Decimal] = Field(default=None, description="Converted amount", decimal_places=2)
    api_response: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON), description="Raw API response")
    success: bool = Field(default=False, description="Whether conversion was successful")
    error_message: Optional[str] = Field(default=None, max_length=500, description="Error message if conversion failed")
    created_at: datetime = Field(default_factory=datetime.utcnow)


class ExchangeRate(SQLModel, table=True):
    """Stores exchange rates for caching and historical tracking."""

    __tablename__ = "exchange_rates"  # type: ignore[assignment]

    id: Optional[int] = Field(default=None, primary_key=True)
    base_currency: str = Field(max_length=3, description="Base currency code")
    target_currency: str = Field(max_length=3, description="Target currency code")
    rate: Decimal = Field(description="Exchange rate", decimal_places=6)
    date: datetime = Field(description="Date of the exchange rate")
    source: str = Field(max_length=50, default="frankfurter", description="Source of exchange rate data")
    created_at: datetime = Field(default_factory=datetime.utcnow)


# Non-persistent schemas for API requests and validation


class ConversionRequestCreate(SQLModel, table=False):
    """Schema for creating a new conversion request."""

    amount: Decimal = Field(gt=0, description="Amount to convert (must be positive)")
    source_currency: str = Field(max_length=3, min_length=3, description="Source currency code (3 letters)")
    target_currency: str = Field(max_length=3, min_length=3, description="Target currency code (3 letters)")


class ConversionResult(SQLModel, table=False):
    """Schema for conversion result response."""

    original_amount: Decimal = Field(description="Original amount")
    source_currency: str = Field(description="Source currency code")
    target_currency: str = Field(description="Target currency code")
    exchange_rate: Decimal = Field(description="Exchange rate used")
    converted_amount: Decimal = Field(description="Converted amount")
    conversion_date: datetime = Field(description="Date and time of conversion")


class CurrencyCreate(SQLModel, table=False):
    """Schema for creating a new currency."""

    code: str = Field(max_length=3, min_length=3, description="ISO 4217 currency code")
    name: str = Field(max_length=100, description="Full currency name")
    symbol: str = Field(max_length=10, description="Currency symbol")
    is_active: bool = Field(default=True, description="Whether this currency is active")


class CurrencyUpdate(SQLModel, table=False):
    """Schema for updating currency information."""

    name: Optional[str] = Field(default=None, max_length=100, description="Full currency name")
    symbol: Optional[str] = Field(default=None, max_length=10, description="Currency symbol")
    is_active: Optional[bool] = Field(default=None, description="Whether this currency is active")
