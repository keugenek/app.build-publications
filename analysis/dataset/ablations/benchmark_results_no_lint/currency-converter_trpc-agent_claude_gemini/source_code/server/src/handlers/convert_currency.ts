import { db } from '../db';
import { exchangeRatesTable } from '../db/schema';
import { type CurrencyConversionRequest, type CurrencyConversionResponse } from '../schema';
import { eq, and, desc } from 'drizzle-orm';

export const convertCurrency = async (input: CurrencyConversionRequest): Promise<CurrencyConversionResponse> => {
  try {
    // If converting the same currency, return as-is
    if (input.from_currency === input.to_currency) {
      return {
        original_amount: input.amount,
        converted_amount: input.amount,
        from_currency: input.from_currency,
        to_currency: input.to_currency,
        exchange_rate: 1.0,
        conversion_date: new Date()
      };
    }

    // Fetch exchange rate from Frankfurter API
    const apiUrl = `https://api.frankfurter.app/latest?from=${input.from_currency}&to=${input.to_currency}`;
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch exchange rate: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as {
      amount: number;
      base: string;
      date: string;
      rates: Record<string, number>;
    };
    
    const exchangeRate = data.rates[input.to_currency];

    if (!exchangeRate) {
      throw new Error(`Exchange rate not found for ${input.from_currency} to ${input.to_currency}`);
    }

    // Calculate converted amount
    const convertedAmount = input.amount * exchangeRate;
    const conversionDate = new Date(data.date);

    // Store exchange rate in database for historical purposes
    try {
      await db.insert(exchangeRatesTable)
        .values({
          from_currency: input.from_currency,
          to_currency: input.to_currency,
          rate: exchangeRate.toString(), // Convert number to string for numeric column
          date: data.date // Store the API date as string
        })
        .execute();
    } catch (dbError) {
      // Log database error but don't fail the conversion
      console.error('Failed to store exchange rate in database:', dbError);
    }

    return {
      original_amount: input.amount,
      converted_amount: convertedAmount,
      from_currency: input.from_currency,
      to_currency: input.to_currency,
      exchange_rate: exchangeRate,
      conversion_date: conversionDate
    };
  } catch (error) {
    console.error('Currency conversion failed:', error);
    throw error;
  }
};
