import { db } from '../db';
import { exchangeRatesTable } from '../db/schema';
import { type CurrencyConversionRequest, type CurrencyConversionResponse } from '../schema';
import { eq, and } from 'drizzle-orm';

export async function convertCurrency(input: CurrencyConversionRequest): Promise<CurrencyConversionResponse> {
  try {
    const todayDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

    // Step 1: Check if we have a cached exchange rate for today
    const cachedRates = await db.select()
      .from(exchangeRatesTable)
      .where(and(
        eq(exchangeRatesTable.from_currency, input.from),
        eq(exchangeRatesTable.to_currency, input.to),
        eq(exchangeRatesTable.date, todayDate)
      ))
      .execute();

    let rate: number;

    if (cachedRates.length > 0) {
      // Use cached rate
      rate = parseFloat(cachedRates[0].rate);
    } else {
      // Step 2: Fetch the latest rate from Frankfurter API
      const apiUrl = `https://api.frankfurter.app/latest?from=${input.from}&to=${input.to}`;
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch exchange rate: ${response.statusText}`);
      }

      const apiData = await response.json() as {
        amount: number;
        base: string;
        date: string;
        rates: Record<string, number>;
      };
      
      if (!apiData.rates || !apiData.rates[input.to]) {
        throw new Error(`Exchange rate not available for ${input.from} to ${input.to}`);
      }

      rate = apiData.rates[input.to];

      // Step 3: Cache the rate in the database
      await db.insert(exchangeRatesTable)
        .values({
          from_currency: input.from,
          to_currency: input.to,
          rate: rate.toString(),
          date: apiData.date, // Use the date from the API response
          updated_at: new Date()
        })
        .execute();
    }

    // Step 4: Calculate the conversion result
    const result = input.amount * rate;

    // Step 5: Return the conversion response
    return {
      amount: input.amount,
      from: input.from,
      to: input.to,
      result: result,
      rate: rate,
      date: todayDate,
      converted_at: new Date()
    };
  } catch (error) {
    console.error('Currency conversion failed:', error);
    throw error;
  }
}
