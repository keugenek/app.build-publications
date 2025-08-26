import { db } from '../db';
import { transactionsTable, budgetsTable } from '../db/schema';
import { sql, asc, and, gte } from 'drizzle-orm';

// Dashboard data types
export type SpendingByCategory = {
  category: string;
  amount: number;
};

export type SpendingTrend = {
  date: Date;
  amount: number;
};

export type DashboardData = {
  spendingByCategory: SpendingByCategory[];
  spendingTrends: SpendingTrend[];
  totalIncome: number;
  totalExpenses: number;
  remainingBudget: number;
};

export const getDashboardData = async (): Promise<DashboardData> => {
  try {
    // Get total income (sum of all income transactions)
    const totalIncomeResult = await db
      .select({
        total: sql<number>`sum(${transactionsTable.amount})::numeric`
      })
      .from(transactionsTable)
      .where(sql`${transactionsTable.type} = 'income'`)
      .execute();

    const totalIncome = totalIncomeResult[0]?.total ? parseFloat(totalIncomeResult[0].total.toString()) : 0;

    // Get total expenses (sum of all expense transactions)
    const totalExpensesResult = await db
      .select({
        total: sql<number>`sum(${transactionsTable.amount})::numeric`
      })
      .from(transactionsTable)
      .where(sql`${transactionsTable.type} = 'expense'`)
      .execute();

    const totalExpenses = totalExpensesResult[0]?.total ? parseFloat(totalExpensesResult[0].total.toString()) : 0;

    // Get spending by category (sum expenses by category)
    const spendingByCategoryResult = await db
      .select({
        category: transactionsTable.category,
        amount: sql<number>`sum(${transactionsTable.amount})::numeric`
      })
      .from(transactionsTable)
      .where(sql`${transactionsTable.type} = 'expense'`)
      .groupBy(transactionsTable.category)
      .execute();

    const spendingByCategory: SpendingByCategory[] = spendingByCategoryResult.map(item => ({
      category: item.category,
      amount: parseFloat(item.amount.toString())
    }));

    // Get spending trends (daily expense sums for the last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Format date as string for PostgreSQL
    const dateString = thirtyDaysAgo.toISOString().split('T')[0];

    const spendingTrendsResult = await db
      .select({
        date: transactionsTable.date,
        amount: sql<number>`sum(${transactionsTable.amount})::numeric`
      })
      .from(transactionsTable)
      .where(
        and(
          sql`${transactionsTable.type} = 'expense'`,
          gte(transactionsTable.date, dateString)
        )
      )
      .groupBy(transactionsTable.date)
      .orderBy(asc(transactionsTable.date))
      .execute();

    const spendingTrends: SpendingTrend[] = spendingTrendsResult.map(item => ({
      date: new Date(item.date),
      amount: parseFloat(item.amount.toString())
    }));

    // Calculate remaining budget
    // For simplicity, we'll sum all budget amounts and subtract total expenses
    const totalBudgetResult = await db
      .select({
        total: sql<number>`sum(${budgetsTable.amount})::numeric`
      })
      .from(budgetsTable)
      .execute();

    const totalBudget = totalBudgetResult[0]?.total ? parseFloat(totalBudgetResult[0].total.toString()) : 0;
    const remainingBudget = totalBudget - totalExpenses;

    return {
      spendingByCategory,
      spendingTrends,
      totalIncome,
      totalExpenses,
      remainingBudget: Math.max(0, remainingBudget) // Ensure non-negative value
    };
  } catch (error) {
    console.error('Dashboard data fetch failed:', error);
    throw error;
  }
};
