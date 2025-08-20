import { db } from '../db';
import { transactionsTable, categoriesTable } from '../db/schema';
import { type DashboardQuery, type DashboardData, type CategorySpending, type SpendingTrend } from '../schema';
import { eq, gte, lte, and, sum, count, desc, SQL } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

export const getDashboardData = async (query: DashboardQuery): Promise<DashboardData> => {
  try {
    // Set default date range if not provided (current month)
    const now = new Date();
    let startDate = query.startDate;
    let endDate = query.endDate;
    
    if (!startDate) {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1); // First day of current month
    }
    
    if (!endDate) {
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0); // Last day of current month
    }

    // Build date filter conditions
    const conditions: SQL<unknown>[] = [];
    conditions.push(gte(transactionsTable.date, startDate));
    conditions.push(lte(transactionsTable.date, endDate));

    // 1. Category breakdown - total spending per category
    const categoryBreakdownQuery = db
      .select({
        category_id: transactionsTable.category_id,
        category_name: categoriesTable.name,
        category_color: categoriesTable.color,
        total_amount: sum(transactionsTable.amount).as('total_amount'),
        transaction_count: count(transactionsTable.id).as('transaction_count')
      })
      .from(transactionsTable)
      .innerJoin(categoriesTable, eq(transactionsTable.category_id, categoriesTable.id))
      .where(and(...conditions))
      .groupBy(transactionsTable.category_id, categoriesTable.name, categoriesTable.color)
      .orderBy(desc(sum(transactionsTable.amount)));

    const categoryBreakdownResults = await categoryBreakdownQuery.execute();
    
    const categoryBreakdown: CategorySpending[] = categoryBreakdownResults.map(result => ({
      category_id: result.category_id,
      category_name: result.category_name,
      category_color: result.category_color,
      total_amount: parseFloat(result.total_amount || '0'),
      transaction_count: result.transaction_count
    }));

    // 2. Spending trends - daily aggregation
    const spendingTrendsQuery = db
      .select({
        date: sql<string>`DATE(${transactionsTable.date})`.as('date'),
        income: sql<string>`COALESCE(SUM(CASE WHEN ${transactionsTable.type} = 'income' THEN ${transactionsTable.amount} ELSE 0 END), 0)`.as('income'),
        expenses: sql<string>`COALESCE(SUM(CASE WHEN ${transactionsTable.type} = 'expense' THEN ${transactionsTable.amount} ELSE 0 END), 0)`.as('expenses')
      })
      .from(transactionsTable)
      .where(and(...conditions))
      .groupBy(sql`DATE(${transactionsTable.date})`)
      .orderBy(sql`DATE(${transactionsTable.date})`);

    const spendingTrendsResults = await spendingTrendsQuery.execute();
    
    const spendingTrends: SpendingTrend[] = spendingTrendsResults.map(result => {
      const income = parseFloat(result.income);
      const expenses = parseFloat(result.expenses);
      return {
        date: result.date,
        income,
        expenses,
        net: income - expenses
      };
    });

    // 3. Summary totals
    const summaryQuery = db
      .select({
        total_income: sql<string>`COALESCE(SUM(CASE WHEN ${transactionsTable.type} = 'income' THEN ${transactionsTable.amount} ELSE 0 END), 0)`.as('total_income'),
        total_expenses: sql<string>`COALESCE(SUM(CASE WHEN ${transactionsTable.type} = 'expense' THEN ${transactionsTable.amount} ELSE 0 END), 0)`.as('total_expenses')
      })
      .from(transactionsTable)
      .where(and(...conditions));

    const summaryResults = await summaryQuery.execute();
    const summary = summaryResults[0];
    
    const totalIncome = parseFloat(summary.total_income);
    const totalExpenses = parseFloat(summary.total_expenses);
    const netAmount = totalIncome - totalExpenses;

    return {
      categoryBreakdown,
      spendingTrends,
      totalIncome,
      totalExpenses,
      netAmount
    };
  } catch (error) {
    console.error('Dashboard data retrieval failed:', error);
    throw error;
  }
};
