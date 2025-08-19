import { db } from '../db';
import { transactionsTable } from '../db/schema';
import { type Transaction, type TransactionFilter } from '../schema';
import { and, eq, gte, lte, desc, isNull, type SQL } from 'drizzle-orm';

export async function getTransactions(filter?: TransactionFilter): Promise<Transaction[]> {
  try {
    // Build conditions array for filtering
    const conditions: SQL<unknown>[] = [];

    if (filter) {
      // Filter by category_id if provided (including null values)
      if (filter.category_id !== undefined) {
        if (filter.category_id === null) {
          conditions.push(isNull(transactionsTable.category_id));
        } else {
          conditions.push(eq(transactionsTable.category_id, filter.category_id));
        }
      }

      // Filter by date range if provided
      if (filter.start_date) {
        conditions.push(gte(transactionsTable.transaction_date, filter.start_date));
      }

      if (filter.end_date) {
        conditions.push(lte(transactionsTable.transaction_date, filter.end_date));
      }

      // Filter by transaction type if provided
      if (filter.type) {
        conditions.push(eq(transactionsTable.type, filter.type));
      }
    }

    // Build the query with proper method chaining
    const baseQuery = db.select().from(transactionsTable);

    // Apply where clause conditionally
    const queryWithWhere = conditions.length > 0
      ? baseQuery.where(conditions.length === 1 ? conditions[0] : and(...conditions))
      : baseQuery;

    // Apply ordering
    const finalQuery = queryWithWhere.orderBy(desc(transactionsTable.transaction_date));

    const results = await finalQuery.execute();

    // Convert numeric amounts from string to number
    return results.map(transaction => ({
      ...transaction,
      amount: parseFloat(transaction.amount)
    }));
  } catch (error) {
    console.error('Get transactions failed:', error);
    throw error;
  }
}
