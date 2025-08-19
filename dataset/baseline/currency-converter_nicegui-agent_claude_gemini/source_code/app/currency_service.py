"""Currency conversion service using Frankfurter API."""

import httpx
from decimal import Decimal
from datetime import datetime
from typing import Dict, Any, List
from sqlmodel import select
import logging

from app.database import get_session
from app.models import ConversionRequest, ConversionResult, Currency, ExchangeRate, ConversionRequestCreate

logger = logging.getLogger(__name__)

FRANKFURTER_BASE_URL = "https://api.frankfurter.app"


class CurrencyConversionError(Exception):
    """Custom exception for currency conversion errors."""

    pass


class FrankfurterAPIService:
    """Service for interacting with Frankfurter API."""

    @staticmethod
    async def get_supported_currencies() -> Dict[str, str]:
        """Fetch list of supported currencies from Frankfurter API."""
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(f"{FRANKFURTER_BASE_URL}/currencies")
                response.raise_for_status()
                return response.json()
        except httpx.TimeoutException:
            raise CurrencyConversionError("API request timed out")
        except httpx.HTTPStatusError as e:
            raise CurrencyConversionError(f"API error: {e.response.status_code}")
        except Exception as e:
            raise CurrencyConversionError(f"Failed to fetch currencies: {str(e)}")

    @staticmethod
    async def get_exchange_rate(from_currency: str, to_currency: str, amount: Decimal) -> Dict[str, Any]:
        """Get exchange rate and convert amount using Frankfurter API."""
        try:
            # Format amount to avoid scientific notation
            amount_str = f"{amount:.2f}"
            url = f"{FRANKFURTER_BASE_URL}/latest"
            params = {"amount": amount_str, "from": from_currency.upper(), "to": to_currency.upper()}

            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(url, params=params)
                response.raise_for_status()
                return response.json()
        except httpx.TimeoutException:
            raise CurrencyConversionError("API request timed out")
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 422:
                raise CurrencyConversionError("Invalid currency code or unsupported conversion")
            raise CurrencyConversionError(f"API error: {e.response.status_code}")
        except Exception as e:
            raise CurrencyConversionError(f"Failed to get exchange rate: {str(e)}")


class CurrencyService:
    """Service for managing currency data and conversions."""

    @staticmethod
    async def sync_currencies() -> int:
        """Sync currencies from Frankfurter API to database."""
        try:
            currencies_data = await FrankfurterAPIService.get_supported_currencies()

            with get_session() as session:
                # Get existing currencies
                existing = session.exec(select(Currency)).all()
                existing_codes = {c.code for c in existing}

                added_count = 0
                for code, name in currencies_data.items():
                    if code not in existing_codes:
                        currency = Currency(
                            code=code,
                            name=name,
                            symbol=code,  # Use code as symbol for now
                            is_active=True,
                        )
                        session.add(currency)
                        added_count += 1

                session.commit()
                logger.info(f"Synced {added_count} new currencies from Frankfurter API")
                return added_count

        except Exception as e:
            logger.error(f"Failed to sync currencies: {str(e)}")
            raise CurrencyConversionError(f"Failed to sync currencies: {str(e)}")

    @staticmethod
    def get_available_currencies() -> List[Currency]:
        """Get list of available currencies from database."""
        with get_session() as session:
            return list(session.exec(select(Currency).where(Currency.is_active)).all())

    @staticmethod
    async def convert_currency(request: ConversionRequestCreate) -> ConversionResult:
        """Convert currency using Frankfurter API and store the request."""
        # Validate input
        if request.source_currency.upper() == request.target_currency.upper():
            raise CurrencyConversionError("Source and target currencies must be different")

        if request.amount <= 0:
            raise CurrencyConversionError("Amount must be positive")

        conversion_request = ConversionRequest(
            amount=request.amount,
            source_currency=request.source_currency.upper(),
            target_currency=request.target_currency.upper(),
        )

        try:
            # Get conversion from API
            api_response = await FrankfurterAPIService.get_exchange_rate(
                request.source_currency, request.target_currency, request.amount
            )

            # Parse response
            converted_amount = Decimal(str(api_response["rates"][request.target_currency.upper()]))
            original_amount = Decimal(str(api_response["amount"]))
            exchange_rate = converted_amount / original_amount if original_amount > 0 else Decimal("0")

            # Update conversion request
            conversion_request.exchange_rate = exchange_rate
            conversion_request.converted_amount = converted_amount
            conversion_request.api_response = api_response
            conversion_request.success = True

            # Store in database
            with get_session() as session:
                # Create fresh instances for this session
                fresh_conversion_request = ConversionRequest(
                    amount=conversion_request.amount,
                    source_currency=conversion_request.source_currency,
                    target_currency=conversion_request.target_currency,
                    exchange_rate=conversion_request.exchange_rate,
                    converted_amount=conversion_request.converted_amount,
                    api_response=conversion_request.api_response,
                    success=conversion_request.success,
                    created_at=conversion_request.created_at,
                )
                session.add(fresh_conversion_request)

                # Store exchange rate
                exchange_rate_record = ExchangeRate(
                    base_currency=request.source_currency.upper(),
                    target_currency=request.target_currency.upper(),
                    rate=exchange_rate,
                    date=datetime.utcnow(),
                    source="frankfurter",
                )
                session.add(exchange_rate_record)
                session.commit()

            return ConversionResult(
                original_amount=original_amount,
                source_currency=request.source_currency.upper(),
                target_currency=request.target_currency.upper(),
                exchange_rate=exchange_rate,
                converted_amount=converted_amount,
                conversion_date=conversion_request.created_at,
            )

        except CurrencyConversionError:
            # Re-raise currency conversion errors
            raise
        except Exception as e:
            # Handle other errors
            error_msg = str(e)
            logger.error(f"Conversion failed: {error_msg}")

            conversion_request.success = False
            conversion_request.error_message = error_msg

            with get_session() as session:
                # Create fresh instance for this session
                fresh_conversion_request = ConversionRequest(
                    amount=conversion_request.amount,
                    source_currency=conversion_request.source_currency,
                    target_currency=conversion_request.target_currency,
                    success=conversion_request.success,
                    error_message=conversion_request.error_message,
                    created_at=conversion_request.created_at,
                )
                session.add(fresh_conversion_request)
                session.commit()

            raise CurrencyConversionError(f"Conversion failed: {error_msg}")

    @staticmethod
    def get_conversion_history(limit: int = 50) -> List[ConversionRequest]:
        """Get recent conversion history."""
        with get_session() as session:
            from sqlmodel import desc

            statement = select(ConversionRequest).order_by(desc(ConversionRequest.created_at)).limit(limit)
            return list(session.exec(statement).all())
