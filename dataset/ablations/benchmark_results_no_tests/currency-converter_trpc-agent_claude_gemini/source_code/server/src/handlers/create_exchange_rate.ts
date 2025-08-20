import { db } from '../db';
import { exchangeRatesTable } from '../db/schema';
import { type CreateExchangeRateInput, type ExchangeRate } from '../schema';

export const createExchangeRate = async (input: CreateExchangeRateInput): Promise<ExchangeRate> => {
  try {
    // Insert exchange rate record
    const result = await db.insert(exchangeRatesTable)
      .values({
        from_currency: input.from_currency,
        to_currency: input.to_currency,
        rate: input.rate.toString(), // Convert number to string for numeric column
        date: input.date
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const exchangeRate = result[0];
    return {
      ...exchangeRate,
      rate: parseFloat(exchangeRate.rate) // Convert string back to number
    };
  } catch (error) {
    console.error('Exchange rate creation failed:', error);
    throw error;
  }
};
