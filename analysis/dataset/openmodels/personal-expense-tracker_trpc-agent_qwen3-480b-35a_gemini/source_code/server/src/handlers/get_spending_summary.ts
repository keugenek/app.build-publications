import { db } from '../db';
import { transactionsTable, budgetsTable } from '../db/schema';
import { and, eq, sum, gte, lte, SQL } from 'drizzle-orm';

export type CategorySummary = {
  category: string;
  amount: number;
  budget: number | null;
  remaining: number | null;
};

export type SpendingSummary = {
  byCategory: CategorySummary[];
  totalIncome: number;
  totalExpenses: number;
  netAmount: number;
};

export const getSpendingSummary = async (month?: number, year?: number): Promise<SpendingSummary> => {
  try {
    // Build date filter conditions if month and year are provided
    const dateConditions: SQL<unknown>[] = [];
    if (month !== undefined && year !== undefined) {
      const startDate = new Date(year, month - 1, 1); // month is 1-based, so subtract 1
      const endDate = new Date(year, month, 0); // Last day of the month
      dateConditions.push(
        gte(transactionsTable.date, startDate.toISOString().split('T')[0]),
        lte(transactionsTable.date, endDate.toISOString().split('T')[0])
      );
    }

    // Query for total income
    const incomeQuery = db.select({
      total: sum(transactionsTable.amount)
    })
    .from(transactionsTable)
    .where(and(
      eq(transactionsTable.type, 'income'),
      ...dateConditions
    ))
    .execute();

    // Query for total expenses
    const expensesQuery = db.select({
      total: sum(transactionsTable.amount)
    })
    .from(transactionsTable)
    .where(and(
      eq(transactionsTable.type, 'expense'),
      ...dateConditions
    ))
    .execute();

    // Query for category-wise spending
    const categorySpendingQuery = db.select({
      category: transactionsTable.category,
      total: sum(transactionsTable.amount)
    })
    .from(transactionsTable)
    .where(and(
      eq(transactionsTable.type, 'expense'),
      ...dateConditions
    ))
    .groupBy(transactionsTable.category)
    .execute();

    // Execute all queries in parallel
    const [incomeResult, expensesResult, categorySpendingResult] = await Promise.all([
      incomeQuery,
      expensesQuery,
      categorySpendingQuery
    ]);

    // Calculate totals
    const totalIncome = incomeResult[0]?.total ? parseFloat(incomeResult[0].total) : 0;
    const totalExpenses = expensesResult[0]?.total ? parseFloat(expensesResult[0].total) : 0;
    const netAmount = totalIncome - totalExpenses;

    // Get budgets if month and year are provided
    let budgetsResult: { category: string; amount: string }[] = [];
    if (month !== undefined && year !== undefined) {
      budgetsResult = await db.select({
        category: budgetsTable.category,
        amount: budgetsTable.amount
      })
      .from(budgetsTable)
      .where(
        and(
          eq(budgetsTable.month, month),
          eq(budgetsTable.year, year)
        )
      )
      .execute();
    }

    // Create a map of budgets for easy lookup
    const budgetMap = new Map<string, number>();
    budgetsResult.forEach(budget => {
      if (budget.amount) {
        budgetMap.set(budget.category, parseFloat(budget.amount));
      }
    });

    // Create category summaries
    const byCategory: CategorySummary[] = categorySpendingResult.map(item => {
      const amount = item.total ? parseFloat(item.total) : 0;
      const budget = budgetMap.get(item.category) || null;
      const remaining = budget !== null ? budget - amount : null;
      
      return {
        category: item.category,
        amount,
        budget,
        remaining
      };
    });

    return {
      byCategory,
      totalIncome,
      totalExpenses,
      netAmount
    };
  } catch (error) {
    console.error('Failed to get spending summary:', error);
    throw error;
  }
};
