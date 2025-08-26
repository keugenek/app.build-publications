import { db } from '../db';
import { conversionsTable } from '../db/schema';
import { type ConversionResult } from '../schema';
import { desc } from 'drizzle-orm';

export const getConversionHistory = async (): Promise<ConversionResult[]> => {
  try {
    // Query conversions ordered by creation date (most recent first)
    const results = await db.select()
      .from(conversionsTable)
      .orderBy(desc(conversionsTable.created_at))
      .execute();

    // Convert numeric fields back to numbers before returning
    return results.map(conversion => ({
      ...conversion,
      amount: parseFloat(conversion.amount),
      exchange_rate: parseFloat(conversion.exchange_rate),
      converted_amount: parseFloat(conversion.converted_amount)
    }));
  } catch (error) {
    console.error('Failed to fetch conversion history:', error);
    throw error;
  }
};
