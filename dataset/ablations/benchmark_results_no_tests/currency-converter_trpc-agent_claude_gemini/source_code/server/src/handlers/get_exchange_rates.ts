import { db } from '../db';
import { exchangeRatesTable } from '../db/schema';
import { type ExchangeRate } from '../schema';

export const getExchangeRates = async (): Promise<ExchangeRate[]> => {
  try {
    // Query all exchange rates from the database
    const results = await db.select()
      .from(exchangeRatesTable)
      .execute();

    // Convert numeric fields back to numbers before returning
    return results.map(rate => ({
      ...rate,
      rate: parseFloat(rate.rate) // Convert numeric string back to number
    }));
  } catch (error) {
    console.error('Failed to fetch exchange rates:', error);
    throw error;
  }
};
