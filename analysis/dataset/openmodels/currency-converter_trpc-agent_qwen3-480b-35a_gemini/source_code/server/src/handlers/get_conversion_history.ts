import { db } from '../db';
import { conversionHistoryTable } from '../db/schema';
import { type ConversionHistory } from '../schema';

export const getConversionHistory = async (): Promise<ConversionHistory[]> => {
  try {
    // Query conversion history from database, ordered by timestamp (newest first)
    const results = await db.select()
      .from(conversionHistoryTable)
      .orderBy(conversionHistoryTable.timestamp)
      .execute();

    // Convert numeric fields back to numbers before returning
    return results.map(history => ({
      ...history,
      amount: parseFloat(history.amount),
      convertedAmount: parseFloat(history.convertedAmount),
      exchangeRate: parseFloat(history.exchangeRate)
    }));
  } catch (error) {
    console.error('Failed to fetch conversion history:', error);
    throw error;
  }
};
