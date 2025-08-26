import { db } from '../db';
import { stockTransactionsTable } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import { type StockTransaction } from '../schema';

export const getStockTransactionsByProduct = async (productId: number): Promise<StockTransaction[]> => {
  try {
    const result = await db.select()
      .from(stockTransactionsTable)
      .where(eq(stockTransactionsTable.product_id, productId))
      .orderBy(desc(stockTransactionsTable.created_at))
      .execute();

    return result.map(transaction => ({
      ...transaction,
      created_at: transaction.created_at
    }));
  } catch (error) {
    console.error('Failed to fetch stock transactions:', error);
    throw error;
  }
};
