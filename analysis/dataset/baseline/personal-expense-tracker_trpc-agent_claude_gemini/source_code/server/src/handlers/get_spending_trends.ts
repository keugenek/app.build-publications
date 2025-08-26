import { db } from '../db';
import { transactionsTable } from '../db/schema';
import { type SpendingTrend, type DateRange } from '../schema';
import { sql, and, gte, lte } from 'drizzle-orm';

export async function getSpendingTrends(dateRange: DateRange): Promise<SpendingTrend[]> {
  try {
    // Query to aggregate daily spending data
    const results = await db
      .select({
        date: sql<string>`DATE(${transactionsTable.transaction_date})::text`,
        total_income: sql<string>`COALESCE(SUM(CASE WHEN ${transactionsTable.type} = 'income' THEN ${transactionsTable.amount} ELSE 0 END), 0)`,
        total_expense: sql<string>`COALESCE(SUM(CASE WHEN ${transactionsTable.type} = 'expense' THEN ${transactionsTable.amount} ELSE 0 END), 0)`,
      })
      .from(transactionsTable)
      .where(
        and(
          gte(transactionsTable.transaction_date, dateRange.start_date),
          lte(transactionsTable.transaction_date, dateRange.end_date)
        )
      )
      .groupBy(sql`DATE(${transactionsTable.transaction_date})`)
      .orderBy(sql`DATE(${transactionsTable.transaction_date})`)
      .execute();

    // Convert numeric fields and calculate net balance
    return results.map(result => {
      const total_income = parseFloat(result.total_income);
      const total_expense = parseFloat(result.total_expense);
      const net_amount = total_income - total_expense;

      return {
        date: result.date,
        total_income,
        total_expense,
        net_amount
      };
    });
  } catch (error) {
    console.error('Failed to get spending trends:', error);
    throw error;
  }
}
