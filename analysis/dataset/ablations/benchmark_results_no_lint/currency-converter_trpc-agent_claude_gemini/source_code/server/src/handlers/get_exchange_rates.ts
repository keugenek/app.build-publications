import { db } from '../db';
import { exchangeRatesTable } from '../db/schema';
import { type ExchangeRate, type CurrencyCode } from '../schema';
import { eq, and, desc, type SQL } from 'drizzle-orm';

export async function getExchangeRates(fromCurrency?: CurrencyCode, toCurrency?: CurrencyCode): Promise<ExchangeRate[]> {
  try {
    // Build conditions array for filtering
    const conditions: SQL<unknown>[] = [];

    if (fromCurrency !== undefined) {
      conditions.push(eq(exchangeRatesTable.from_currency, fromCurrency));
    }

    if (toCurrency !== undefined) {
      conditions.push(eq(exchangeRatesTable.to_currency, toCurrency));
    }

    // Build the complete query at once
    const query = db.select()
      .from(exchangeRatesTable)
      .where(conditions.length > 0 ? (conditions.length === 1 ? conditions[0] : and(...conditions)) : undefined)
      .orderBy(desc(exchangeRatesTable.date), desc(exchangeRatesTable.created_at));

    const results = await query.execute();

    // Convert numeric fields and date fields to proper types before returning
    return results.map(rate => ({
      ...rate,
      rate: parseFloat(rate.rate), // Convert string back to number
      date: new Date(rate.date), // Convert string back to Date object
      created_at: new Date(rate.created_at) // Ensure created_at is also a Date object
    }));
  } catch (error) {
    console.error('Failed to retrieve exchange rates:', error);
    throw error;
  }
}
