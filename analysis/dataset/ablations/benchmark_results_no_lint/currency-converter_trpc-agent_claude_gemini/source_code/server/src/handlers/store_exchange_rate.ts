import { db } from '../db';
import { exchangeRatesTable } from '../db/schema';
import { type CreateExchangeRateInput, type ExchangeRate } from '../schema';

export const storeExchangeRate = async (input: CreateExchangeRateInput): Promise<ExchangeRate> => {
  try {
    // Insert exchange rate record
    const result = await db.insert(exchangeRatesTable)
      .values({
        from_currency: input.from_currency,
        to_currency: input.to_currency,
        rate: input.rate.toString(), // Convert number to string for numeric column
        date: input.date.toISOString().split('T')[0] // Convert Date to YYYY-MM-DD string
      })
      .returning()
      .execute();

    // Convert numeric and date fields back to proper types before returning
    const exchangeRate = result[0];
    return {
      ...exchangeRate,
      rate: parseFloat(exchangeRate.rate), // Convert string back to number
      date: new Date(exchangeRate.date) // Convert date string back to Date
    };
  } catch (error) {
    console.error('Exchange rate storage failed:', error);
    throw error;
  }
};
