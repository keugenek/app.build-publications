import { db } from '../db';
import { transactionsTable } from '../db/schema';
import { type FinancialSummary, type DateRange } from '../schema';
import { and, gte, lte, eq, sum } from 'drizzle-orm';
import { SQL } from 'drizzle-orm';

export async function getFinancialSummary(dateRange: DateRange): Promise<FinancialSummary> {
  try {
    // Build conditions for date range filtering
    const conditions: SQL<unknown>[] = [];
    
    conditions.push(gte(transactionsTable.transaction_date, dateRange.start_date));
    conditions.push(lte(transactionsTable.transaction_date, dateRange.end_date));

    // Get total income
    const incomeQuery = db.select({
      total: sum(transactionsTable.amount)
    })
    .from(transactionsTable)
    .where(and(
      ...conditions,
      eq(transactionsTable.type, 'income')
    ));

    // Get total expenses  
    const expenseQuery = db.select({
      total: sum(transactionsTable.amount)
    })
    .from(transactionsTable)
    .where(and(
      ...conditions,
      eq(transactionsTable.type, 'expense')
    ));

    // Execute both queries
    const [incomeResult, expenseResult] = await Promise.all([
      incomeQuery.execute(),
      expenseQuery.execute()
    ]);

    // Extract totals and handle null values (when no records found)
    const totalIncome = incomeResult[0]?.total ? parseFloat(incomeResult[0].total) : 0;
    const totalExpense = expenseResult[0]?.total ? parseFloat(expenseResult[0].total) : 0;

    // Calculate net balance (income - expenses)
    const netBalance = totalIncome - totalExpense;

    return {
      total_income: totalIncome,
      total_expense: totalExpense,
      net_balance: netBalance,
      start_date: dateRange.start_date,
      end_date: dateRange.end_date
    };
  } catch (error) {
    console.error('Financial summary calculation failed:', error);
    throw error;
  }
}
