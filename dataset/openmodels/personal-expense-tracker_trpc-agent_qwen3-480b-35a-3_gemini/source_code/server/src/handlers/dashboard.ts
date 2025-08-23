import { db } from '../db';
import { categoriesTable, transactionsTable, budgetsTable } from '../db/schema';
import { eq, sql, and, gt, lt, gte, lte, asc } from 'drizzle-orm';
import { type DashboardData } from '../schema';

export const getDashboardData = async (): Promise<DashboardData> => {
  try {
    // Get current date for filtering
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // getMonth() is 0-indexed

    // Format dates as strings for database queries
    const startDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;
    const endDate = new Date(currentYear, currentMonth, 1).toISOString().split('T')[0];
    const sixMonthsAgo = new Date(currentYear, currentMonth - 7, 1).toISOString().split('T')[0];

    // 1. Category Spending - Total spending per category for the current month
    const categorySpendingQuery = await db.select({
      categoryId: categoriesTable.id,
      categoryName: categoriesTable.name,
      amount: sql<number>`SUM(${transactionsTable.amount}::numeric)`.as('amount')
    })
    .from(transactionsTable)
    .innerJoin(categoriesTable, eq(transactionsTable.categoryId, categoriesTable.id))
    .where(
      and(
        eq(transactionsTable.type, 'expense'),
        gte(transactionsTable.date, sql.raw(startDate)),
        lt(transactionsTable.date, sql.raw(endDate))
      )
    )
    .groupBy(categoriesTable.id, categoriesTable.name)
    .execute();

    const categorySpending = categorySpendingQuery.map(row => ({
      categoryId: row.categoryId,
      categoryName: row.categoryName,
      amount: row.amount ? parseFloat(row.amount.toString()) : 0
    }));

    // 2. Monthly Spending - Total spending per month for the last 6 months
    const monthlySpendingQuery = await db.select({
      month: sql<number>`EXTRACT(MONTH FROM ${transactionsTable.date})`.as('month'),
      year: sql<number>`EXTRACT(YEAR FROM ${transactionsTable.date})`.as('year'),
      amount: sql<number>`SUM(${transactionsTable.amount}::numeric)`.as('amount')
    })
    .from(transactionsTable)
    .where(
      and(
        eq(transactionsTable.type, 'expense'),
        gte(transactionsTable.date, sql.raw(sixMonthsAgo)),
        lt(transactionsTable.date, sql.raw(endDate))
      )
    )
    .groupBy(
      sql`EXTRACT(MONTH FROM ${transactionsTable.date})`,
      sql`EXTRACT(YEAR FROM ${transactionsTable.date})`
    )
    .orderBy(sql`EXTRACT(YEAR FROM ${transactionsTable.date})`, sql`EXTRACT(MONTH FROM ${transactionsTable.date})`)
    .execute();

    const monthlySpending = monthlySpendingQuery.map(row => ({
      month: parseInt(row.month.toString()),
      year: parseInt(row.year.toString()),
      amount: row.amount ? parseFloat(row.amount.toString()) : 0
    }));

    // 3. Budget Status - Compare budgeted amounts vs actual spending
    // First get all categories with budgets for the current month
    const budgetStatusQuery = await db.select({
      categoryId: categoriesTable.id,
      categoryName: categoriesTable.name,
      budgetedAmount: budgetsTable.amount,
      spentAmount: sql<number>`COALESCE(SUM(CASE WHEN ${transactionsTable.type} = 'expense' THEN ${transactionsTable.amount}::numeric ELSE 0 END), 0)`.as('spentAmount')
    })
    .from(categoriesTable)
    .leftJoin(budgetsTable, and(
      eq(categoriesTable.id, budgetsTable.categoryId),
      eq(budgetsTable.month, currentMonth),
      eq(budgetsTable.year, currentYear)
    ))
    .leftJoin(transactionsTable, and(
      eq(categoriesTable.id, transactionsTable.categoryId),
      eq(transactionsTable.type, 'expense'),
      gte(transactionsTable.date, sql.raw(startDate)),
      lt(transactionsTable.date, sql.raw(endDate))
    ))
    .where(eq(categoriesTable.type, 'expense'))
    .groupBy(categoriesTable.id, categoriesTable.name, budgetsTable.amount)
    .execute();

    const budgetStatus = budgetStatusQuery.map(row => {
      const budgetedAmount = row.budgetedAmount ? parseFloat(row.budgetedAmount.toString()) : 0;
      const spentAmount = row.spentAmount ? parseFloat(row.spentAmount.toString()) : 0;
      const remainingAmount = budgetedAmount - spentAmount;
      const isOverBudget = spentAmount > budgetedAmount;
      
      return {
        categoryId: row.categoryId,
        categoryName: row.categoryName,
        budgetedAmount,
        spentAmount,
        remainingAmount,
        isOverBudget
      };
    });

    return {
      categorySpending,
      monthlySpending,
      budgetStatus
    };
  } catch (error) {
    console.error('Dashboard data fetch failed:', error);
    throw error;
  }
};
