import { db } from '../db';
import { transactionsTable, categoriesTable } from '../db/schema';
import { type SpendingByCategory, type DateRange } from '../schema';
import { eq, and, gte, lte, sum, count, sql } from 'drizzle-orm';

export async function getSpendingByCategory(dateRange: DateRange): Promise<SpendingByCategory[]> {
  try {
    // Query to aggregate spending by category for expense transactions only
    // Left join to include uncategorized transactions (category_id = null)
    const results = await db
      .select({
        category_id: transactionsTable.category_id,
        category_name: categoriesTable.name,
        total_amount: sum(transactionsTable.amount).as('total_amount'),
        transaction_count: count(transactionsTable.id).as('transaction_count')
      })
      .from(transactionsTable)
      .leftJoin(categoriesTable, eq(transactionsTable.category_id, categoriesTable.id))
      .where(
        and(
          eq(transactionsTable.type, 'expense'), // Only expense transactions
          gte(transactionsTable.transaction_date, dateRange.start_date),
          lte(transactionsTable.transaction_date, dateRange.end_date)
        )
      )
      .groupBy(transactionsTable.category_id, categoriesTable.name)
      .orderBy(sql`total_amount DESC`) // Order by spending amount descending
      .execute();

    // Convert numeric fields and handle null values
    return results.map(result => ({
      category_id: result.category_id,
      category_name: result.category_name, // Will be null for uncategorized transactions
      total_amount: parseFloat(result.total_amount || '0'), // Convert string to number
      transaction_count: Number(result.transaction_count) // Convert to number
    }));
  } catch (error) {
    console.error('Get spending by category failed:', error);
    throw error;
  }
}
