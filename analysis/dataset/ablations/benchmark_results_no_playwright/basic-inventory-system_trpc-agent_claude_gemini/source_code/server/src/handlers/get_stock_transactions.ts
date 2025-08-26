import { db } from '../db';
import { stockTransactionsTable } from '../db/schema';
import { type StockTransaction } from '../schema';
import { desc } from 'drizzle-orm';

export const getStockTransactions = async (): Promise<StockTransaction[]> => {
  try {
    // Fetch all stock transactions ordered by creation date (most recent first)
    const results = await db.select()
      .from(stockTransactionsTable)
      .orderBy(desc(stockTransactionsTable.created_at))
      .execute();

    // Return results - no numeric conversions needed for this schema
    return results;
  } catch (error) {
    console.error('Getting stock transactions failed:', error);
    throw error;
  }
};
