import { db } from '../db';
import { categoriesTable, transactionsTable, budgetsTable } from '../db/schema';
import { type DashboardData, type DashboardFilters } from '../schema';
import { sql, eq, and, gte, lte, desc, asc } from 'drizzle-orm';

export const getDashboardData = async (filters?: DashboardFilters): Promise<DashboardData> => {
  try {
    const currentDate = new Date();
    const year = filters?.year ?? currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    // 1. Category spending data - total expenses grouped by category
    const categorySpendingQuery = db
      .select({
        category_id: transactionsTable.category_id,
        category_name: categoriesTable.name,
        total_amount: sql<string>`sum(${transactionsTable.amount})`.as('total_amount')
      })
      .from(transactionsTable)
      .leftJoin(categoriesTable, eq(transactionsTable.category_id, categoriesTable.id))
      .where(
        and(
          eq(transactionsTable.type, 'expense'),
          gte(transactionsTable.date, sql`date_trunc('year', make_date(${year}, 1, 1))`),
          lte(transactionsTable.date, sql`date_trunc('year', make_date(${year}, 1, 1)) + interval '1 year' - interval '1 day'`)
        )
      )
      .groupBy(transactionsTable.category_id, categoriesTable.name);

    const categorySpendingResults = await categorySpendingQuery.execute();

    // 2. Monthly overview data - income vs expenses over time
    const monthlyOverviewQuery = db
      .select({
        month: sql<number>`extract(month from ${transactionsTable.date})`.as('month'),
        year: sql<number>`extract(year from ${transactionsTable.date})`.as('year'),
        type: transactionsTable.type,
        total_amount: sql<string>`sum(${transactionsTable.amount})`.as('total_amount')
      })
      .from(transactionsTable)
      .where(
        and(
          gte(transactionsTable.date, sql`date_trunc('year', make_date(${year}, 1, 1))`),
          lte(transactionsTable.date, sql`date_trunc('year', make_date(${year}, 1, 1)) + interval '1 year' - interval '1 day'`)
        )
      )
      .groupBy(
        sql`extract(month from ${transactionsTable.date})`,
        sql`extract(year from ${transactionsTable.date})`,
        transactionsTable.type
      )
      .orderBy(
        asc(sql`extract(year from ${transactionsTable.date})`),
        asc(sql`extract(month from ${transactionsTable.date})`)
      );

    const monthlyOverviewResults = await monthlyOverviewQuery.execute();

    // 3. Current month budget status
    const budgetStatusQuery = db
      .select({
        id: budgetsTable.id,
        category_id: budgetsTable.category_id,
        monthly_limit: budgetsTable.monthly_limit,
        month: budgetsTable.month,
        year: budgetsTable.year,
        created_at: budgetsTable.created_at,
        category_name: categoriesTable.name,
        spent_amount: sql<string>`coalesce(sum(${transactionsTable.amount}), 0)`.as('spent_amount')
      })
      .from(budgetsTable)
      .innerJoin(categoriesTable, eq(budgetsTable.category_id, categoriesTable.id))
      .leftJoin(
        transactionsTable,
        and(
          eq(transactionsTable.category_id, budgetsTable.category_id),
          eq(transactionsTable.type, 'expense'),
          sql`extract(month from ${transactionsTable.date}) = ${budgetsTable.month}`,
          sql`extract(year from ${transactionsTable.date}) = ${budgetsTable.year}`
        )
      )
      .where(
        and(
          eq(budgetsTable.month, currentMonth),
          eq(budgetsTable.year, currentYear)
        )
      )
      .groupBy(
        budgetsTable.id,
        budgetsTable.category_id,
        budgetsTable.monthly_limit,
        budgetsTable.month,
        budgetsTable.year,
        budgetsTable.created_at,
        categoriesTable.name
      )
      .orderBy(asc(categoriesTable.name));

    const budgetStatusResults = await budgetStatusQuery.execute();

    // Process results and convert numeric fields
    const categorySpending = categorySpendingResults.map(result => ({
      category_id: result.category_id,
      category_name: result.category_name ?? 'Uncategorized',
      total_amount: parseFloat(result.total_amount)
    }));

    // Group monthly overview by month and aggregate income/expense
    const monthlyOverviewMap = new Map<string, { month: number; year: number; total_income: number; total_expenses: number }>();

    monthlyOverviewResults.forEach(result => {
      const key = `${result.year}-${result.month}`;
      const existing = monthlyOverviewMap.get(key) || {
        month: result.month,
        year: result.year,
        total_income: 0,
        total_expenses: 0
      };

      const amount = parseFloat(result.total_amount);
      if (result.type === 'income') {
        existing.total_income += amount;
      } else {
        existing.total_expenses += amount;
      }

      monthlyOverviewMap.set(key, existing);
    });

    const monthlyOverview = Array.from(monthlyOverviewMap.values())
      .map(overview => ({
        ...overview,
        net_amount: overview.total_income - overview.total_expenses
      }))
      .sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.month - b.month;
      });

    const currentMonthBudgets = budgetStatusResults.map(result => ({
      id: result.id,
      category_id: result.category_id,
      monthly_limit: parseFloat(result.monthly_limit),
      month: result.month,
      year: result.year,
      created_at: result.created_at,
      category_name: result.category_name,
      spent_amount: parseFloat(result.spent_amount)
    }));

    return {
      category_spending: categorySpending,
      monthly_overview: monthlyOverview,
      current_month_budgets: currentMonthBudgets
    };
  } catch (error) {
    console.error('Dashboard data retrieval failed:', error);
    throw error;
  }
};
