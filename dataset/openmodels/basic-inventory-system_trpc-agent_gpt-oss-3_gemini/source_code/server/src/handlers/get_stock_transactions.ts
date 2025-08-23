import { db } from '../db';
import { stock_transactions } from '../db/schema';
import { type StockTransaction } from '../schema';

/**
 * Fetch all stock transactions from the database.
 * Returns an array of StockTransaction objects.
 */
export const getStockTransactions = async (): Promise<StockTransaction[]> => {
  try {
    const results = await db.select().from(stock_transactions).execute();
    // No numeric conversion needed as integer columns are returned as numbers.
    return results;
  } catch (error) {
    console.error('Failed to fetch stock transactions:', error);
    throw error;
  }
};
