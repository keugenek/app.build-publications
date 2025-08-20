import { db } from '../db';
import { exchangeRatesTable } from '../db/schema';
import { type ExchangeRate } from '../schema';
import { eq, and } from 'drizzle-orm';

/**
 * Handler for fetching current exchange rates from external API.
 * This handler will:
 * 1. Check for cached rates first (if today's rates exist)
 * 2. Make a request to Frankfurter API to get current exchange rates
 * 3. Cache the rates in database to reduce API calls for repeated requests
 * 4. Handle API errors gracefully and return cached rates if available
 * 5. Return structured exchange rate data
 */
export async function getExchangeRate(baseCurrency: string, targetCurrency?: string): Promise<ExchangeRate> {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

    // First, check if we have cached rates for today
    try {
      if (targetCurrency) {
        // Check for specific currency pair
        const cachedRate = await db.select()
          .from(exchangeRatesTable)
          .where(
            and(
              eq(exchangeRatesTable.base_currency, baseCurrency),
              eq(exchangeRatesTable.target_currency, targetCurrency),
              eq(exchangeRatesTable.rate_date, today)
            )
          )
          .limit(1)
          .execute();

        if (cachedRate.length > 0) {
          return {
            date: today,
            base: baseCurrency,
            rates: {
              [targetCurrency]: parseFloat(cachedRate[0].rate)
            }
          };
        }
      } else {
        // Check if we have any cached rates for today with this base currency
        const cachedRates = await db.select()
          .from(exchangeRatesTable)
          .where(
            and(
              eq(exchangeRatesTable.base_currency, baseCurrency),
              eq(exchangeRatesTable.rate_date, today)
            )
          )
          .execute();

        if (cachedRates.length > 0) {
          const rates: Record<string, number> = {};
          cachedRates.forEach(rate => {
            rates[rate.target_currency] = parseFloat(rate.rate);
          });

          return {
            date: today,
            base: baseCurrency,
            rates
          };
        }
      }
    } catch (cacheError) {
      console.error('Cache lookup failed, proceeding to API:', cacheError);
    }

    // If no cached rates, fetch from API
    const apiUrl = targetCurrency 
      ? `https://api.frankfurter.app/latest?from=${baseCurrency}&to=${targetCurrency}`
      : `https://api.frankfurter.app/latest?from=${baseCurrency}`;

    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`Frankfurter API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as any;
    
    // Validate the API response structure
    if (!data.date || !data.base || !data.rates || typeof data.rates !== 'object') {
      throw new Error('Invalid response format from Frankfurter API');
    }

    const exchangeRate: ExchangeRate = {
      date: data.date,
      base: data.base,
      rates: data.rates
    };

    // Cache the rates in database (async, non-blocking)
    try {
      const cachePromises = Object.entries(data.rates).map(([currency, rate]) => 
        db.insert(exchangeRatesTable)
          .values({
            base_currency: baseCurrency,
            target_currency: currency,
            rate: (rate as number).toString(),
            rate_date: data.date
          })
          .execute()
          .catch(error => {
            console.error(`Failed to cache rate for ${baseCurrency}/${currency}:`, error);
          })
      );

      // Don't wait for caching to complete
      Promise.all(cachePromises).catch(error => {
        console.error('Some cache operations failed:', error);
      });
    } catch (cacheError) {
      console.error('Cache operation setup failed:', cacheError);
    }

    return exchangeRate;

  } catch (error) {
    console.error('Exchange rate fetch failed:', error);
    
    // Try to return cached rates from any previous date as fallback
    try {
      if (targetCurrency) {
        const fallbackRate = await db.select()
          .from(exchangeRatesTable)
          .where(
            and(
              eq(exchangeRatesTable.base_currency, baseCurrency),
              eq(exchangeRatesTable.target_currency, targetCurrency)
            )
          )
          .limit(1)
          .execute();

        if (fallbackRate.length > 0) {
          console.log('Using fallback cached rate');
          return {
            date: fallbackRate[0].rate_date,
            base: baseCurrency,
            rates: {
              [targetCurrency]: parseFloat(fallbackRate[0].rate)
            }
          };
        }
      } else {
        const fallbackRates = await db.select()
          .from(exchangeRatesTable)
          .where(eq(exchangeRatesTable.base_currency, baseCurrency))
          .execute();

        if (fallbackRates.length > 0) {
          console.log('Using fallback cached rates');
          const rates: Record<string, number> = {};
          const latestDate = fallbackRates[0].rate_date;

          // Get all rates for the latest available date
          const latestRates = fallbackRates.filter(rate => rate.rate_date === latestDate);
          latestRates.forEach(rate => {
            rates[rate.target_currency] = parseFloat(rate.rate);
          });

          return {
            date: latestDate,
            base: baseCurrency,
            rates
          };
        }
      }
    } catch (fallbackError) {
      console.error('Fallback cache lookup also failed:', fallbackError);
    }

    // If all fails, throw the original error
    throw error;
  }
}
