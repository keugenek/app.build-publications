import { db } from '../db';
import { transactionsTable } from '../db/schema';
import { type GetTransactionsInput, type Transaction } from '../schema';
import { eq, desc, and, type SQL } from 'drizzle-orm';

export async function getTransactions(input?: GetTransactionsInput): Promise<Transaction[]> {
  try {
    // Build conditions array for filtering
    const conditions: SQL<unknown>[] = [];

    if (input?.product_id !== undefined) {
      conditions.push(eq(transactionsTable.product_id, input.product_id));
    }

    if (input?.type !== undefined) {
      conditions.push(eq(transactionsTable.type, input.type));
    }

    // Build the complete query in one go to avoid TypeScript issues
    const limit = input?.limit ?? 50;
    const offset = input?.offset ?? 0;

    let query;
    
    if (conditions.length > 0) {
      // Query with conditions
      const whereClause = conditions.length === 1 ? conditions[0] : and(...conditions);
      query = db.select()
        .from(transactionsTable)
        .where(whereClause)
        .orderBy(desc(transactionsTable.created_at))
        .limit(limit)
        .offset(offset);
    } else {
      // Query without conditions
      query = db.select()
        .from(transactionsTable)
        .orderBy(desc(transactionsTable.created_at))
        .limit(limit)
        .offset(offset);
    }

    const results = await query.execute();

    // Return results - no numeric conversions needed since all fields are integers
    return results;
  } catch (error) {
    console.error('Failed to get transactions:', error);
    throw error;
  }
}
