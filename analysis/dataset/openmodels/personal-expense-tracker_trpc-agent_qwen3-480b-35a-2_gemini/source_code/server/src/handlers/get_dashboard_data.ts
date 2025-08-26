import { db } from '../db';
import { categoriesTable, transactionsTable, budgetsTable } from '../db/schema';
import { type CategorySpending, type MonthlySpending } from '../schema';
import { sql } from 'drizzle-orm';

export const getDashboardData = async (): Promise<{
  categorySpending: CategorySpending[];
  monthlySpending: MonthlySpending[];
}> => {
  try {
    // Fetch category spending with budget information (only expenses)
    const categorySpendingQuery = db.select({
      category_id: categoriesTable.id,
      category_name: categoriesTable.name,
      total_spent: sql<number>`COALESCE(ABS(SUM(CASE WHEN ${transactionsTable.amount} < 0 THEN ${transactionsTable.amount} ELSE 0 END)), 0)`.mapWith(Number),
      budget_amount: sql<number>`CAST(${budgetsTable.amount} AS NUMERIC)`.mapWith(Number),
    })
    .from(categoriesTable)
    .leftJoin(transactionsTable, sql`${categoriesTable.id} = ${transactionsTable.category_id}`)
    .leftJoin(budgetsTable, sql`${categoriesTable.id} = ${budgetsTable.category_id}`)
    .groupBy(categoriesTable.id, categoriesTable.name, budgetsTable.amount);

    // Fetch monthly spending data
    const monthlySpendingQuery = db.select({
      month: sql<number>`EXTRACT(MONTH FROM ${transactionsTable.date})`.mapWith(Number),
      year: sql<number>`EXTRACT(YEAR FROM ${transactionsTable.date})`.mapWith(Number),
      total_income: sql<number>`COALESCE(SUM(CASE WHEN ${transactionsTable.amount} > 0 THEN ${transactionsTable.amount} ELSE 0 END), 0)`.mapWith(Number),
      total_expenses: sql<number>`COALESCE(ABS(SUM(CASE WHEN ${transactionsTable.amount} < 0 THEN ${transactionsTable.amount} ELSE 0 END)), 0)`.mapWith(Number),
    })
    .from(transactionsTable)
    .groupBy(sql`EXTRACT(MONTH FROM ${transactionsTable.date}), EXTRACT(YEAR FROM ${transactionsTable.date})`)
    .orderBy(sql`EXTRACT(YEAR FROM ${transactionsTable.date}), EXTRACT(MONTH FROM ${transactionsTable.date})`);

    // Execute both queries
    const [categorySpending, monthlySpending] = await Promise.all([
      categorySpendingQuery.execute(),
      monthlySpendingQuery.execute()
    ]);

    // Convert numeric fields back to numbers
    const processedCategorySpending: CategorySpending[] = categorySpending.map(item => ({
      ...item,
      total_spent: parseFloat(item.total_spent as unknown as string),
      budget_amount: item.budget_amount ? parseFloat(item.budget_amount as unknown as string) : null
    }));

    const processedMonthlySpending: MonthlySpending[] = monthlySpending.map(item => ({
      ...item,
      total_income: parseFloat(item.total_income as unknown as string),
      total_expenses: parseFloat(item.total_expenses as unknown as string)
    }));

    return {
      categorySpending: processedCategorySpending,
      monthlySpending: processedMonthlySpending
    };
  } catch (error) {
    console.error('Dashboard data retrieval failed:', error);
    throw error;
  }
};
