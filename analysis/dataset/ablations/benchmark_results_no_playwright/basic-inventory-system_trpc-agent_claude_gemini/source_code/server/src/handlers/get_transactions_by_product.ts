import { db } from '../db';
import { stockTransactionsTable } from '../db/schema';
import { type GetTransactionsByProductInput, type StockTransaction } from '../schema';
import { eq, desc } from 'drizzle-orm';

export async function getTransactionsByProduct(input: GetTransactionsByProductInput): Promise<StockTransaction[]> {
  try {
    // Fetch all stock transactions for the specific product
    // Ordered by creation date (most recent first)
    const results = await db.select()
      .from(stockTransactionsTable)
      .where(eq(stockTransactionsTable.product_id, input.product_id))
      .orderBy(desc(stockTransactionsTable.created_at))
      .execute();

    return results;
  } catch (error) {
    console.error('Get transactions by product failed:', error);
    throw error;
  }
}
