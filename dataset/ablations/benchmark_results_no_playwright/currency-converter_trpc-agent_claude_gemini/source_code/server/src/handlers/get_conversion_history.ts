import { db } from '../db';
import { currencyConversionsTable } from '../db/schema';
import { type GetConversionHistoryInput, type CurrencyConversionResult } from '../schema';
import { desc } from 'drizzle-orm';

/**
 * Handler for retrieving currency conversion history.
 * This handler will:
 * 1. Query the database for previous currency conversions
 * 2. Apply pagination using limit and offset
 * 3. Return the conversion history ordered by most recent first
 */
export async function getConversionHistory(input: GetConversionHistoryInput): Promise<CurrencyConversionResult[]> {
  try {
    // Build and execute the query with all modifiers in one chain
    const results = await db.select()
      .from(currencyConversionsTable)
      .orderBy(desc(currencyConversionsTable.created_at))
      .limit(input.limit)
      .offset(input.offset)
      .execute();

    // Convert numeric fields back to numbers and dates to Date objects before returning
    return results.map(result => ({
      ...result,
      amount: parseFloat(result.amount),
      exchange_rate: parseFloat(result.exchange_rate),
      converted_amount: parseFloat(result.converted_amount),
      conversion_date: new Date(result.conversion_date)
    }));
  } catch (error) {
    console.error('Failed to fetch conversion history:', error);
    throw error;
  }
}
