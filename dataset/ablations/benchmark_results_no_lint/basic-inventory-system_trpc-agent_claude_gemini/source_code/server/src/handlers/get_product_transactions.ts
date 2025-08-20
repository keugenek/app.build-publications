import { db } from '../db';
import { transactionsTable } from '../db/schema';
import { type Transaction } from '../schema';
import { eq, desc } from 'drizzle-orm';

export async function getProductTransactions(productId: number): Promise<Transaction[]> {
  try {
    const results = await db.select()
      .from(transactionsTable)
      .where(eq(transactionsTable.product_id, productId))
      .orderBy(desc(transactionsTable.created_at))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to get product transactions:', error);
    throw error;
  }
}
