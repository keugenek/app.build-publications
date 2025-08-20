import { db } from '../db';
import { categoriesTable, transactionsTable, budgetsTable } from '../db/schema';
import { type DashboardQuery, type DashboardData } from '../schema';
import { sql, eq, and, gte, lte, sum } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';

export async function getDashboardData(query: DashboardQuery): Promise<DashboardData> {
  try {
    // Build date filters
    const dateConditions: SQL<unknown>[] = [];
    
    if (query.start_date) {
      dateConditions.push(gte(transactionsTable.transaction_date, query.start_date));
    }
    
    if (query.end_date) {
      dateConditions.push(lte(transactionsTable.transaction_date, query.end_date));
    }
    
    // Month/year filtering (if specified, override start/end dates)
    if (query.month && query.year) {
      const startOfMonth = new Date(query.year, query.month - 1, 1);
      const endOfMonth = new Date(query.year, query.month, 0, 23, 59, 59, 999);
      
      // Clear existing date conditions and add month-specific ones
      dateConditions.length = 0;
      dateConditions.push(gte(transactionsTable.transaction_date, startOfMonth));
      dateConditions.push(lte(transactionsTable.transaction_date, endOfMonth));
    }

    // Get category spending breakdown (expenses only)
    const categoryConditions: SQL<unknown>[] = [eq(transactionsTable.type, 'expense')];
    if (dateConditions.length > 0) {
      categoryConditions.push(...dateConditions);
    }

    const categorySpendingResults = await db
      .select({
        category_id: categoriesTable.id,
        category_name: categoriesTable.name,
        category_color: categoriesTable.color,
        total_amount: sum(transactionsTable.amount).as('total_amount'),
        transaction_count: sql<string>`count(${transactionsTable.id})`.as('transaction_count')
      })
      .from(transactionsTable)
      .innerJoin(categoriesTable, eq(transactionsTable.category_id, categoriesTable.id))
      .where(and(...categoryConditions))
      .groupBy(categoriesTable.id, categoriesTable.name, categoriesTable.color)
      .execute();

    // Convert and format category spending data
    const category_spending = categorySpendingResults.map(result => ({
      category_id: result.category_id,
      category_name: result.category_name,
      category_color: result.category_color,
      total_amount: parseFloat(result.total_amount || '0'),
      transaction_count: parseInt(result.transaction_count || '0')
    }));

    // Get monthly trends - need to handle both with and without date filters
    let monthlyResults;
    if (dateConditions.length > 0) {
      monthlyResults = await db
        .select({
          month: sql<string>`EXTRACT(MONTH FROM ${transactionsTable.transaction_date})`.as('month'),
          year: sql<string>`EXTRACT(YEAR FROM ${transactionsTable.transaction_date})`.as('year'),
          type: transactionsTable.type,
          total: sum(transactionsTable.amount).as('total')
        })
        .from(transactionsTable)
        .where(and(...dateConditions))
        .groupBy(
          sql`EXTRACT(MONTH FROM ${transactionsTable.transaction_date})`,
          sql`EXTRACT(YEAR FROM ${transactionsTable.transaction_date})`,
          transactionsTable.type
        )
        .orderBy(
          sql`EXTRACT(YEAR FROM ${transactionsTable.transaction_date})`,
          sql`EXTRACT(MONTH FROM ${transactionsTable.transaction_date})`
        )
        .execute();
    } else {
      monthlyResults = await db
        .select({
          month: sql<string>`EXTRACT(MONTH FROM ${transactionsTable.transaction_date})`.as('month'),
          year: sql<string>`EXTRACT(YEAR FROM ${transactionsTable.transaction_date})`.as('year'),
          type: transactionsTable.type,
          total: sum(transactionsTable.amount).as('total')
        })
        .from(transactionsTable)
        .groupBy(
          sql`EXTRACT(MONTH FROM ${transactionsTable.transaction_date})`,
          sql`EXTRACT(YEAR FROM ${transactionsTable.transaction_date})`,
          transactionsTable.type
        )
        .orderBy(
          sql`EXTRACT(YEAR FROM ${transactionsTable.transaction_date})`,
          sql`EXTRACT(MONTH FROM ${transactionsTable.transaction_date})`
        )
        .execute();
    }

    // Process monthly trends data
    const monthlyMap = new Map<string, { month: number; year: number; total_income: number; total_expenses: number }>();
    
    monthlyResults.forEach(result => {
      const month = parseInt(result.month);
      const year = parseInt(result.year);
      const key = `${year}-${month}`;
      if (!monthlyMap.has(key)) {
        monthlyMap.set(key, {
          month,
          year,
          total_income: 0,
          total_expenses: 0
        });
      }
      
      const monthData = monthlyMap.get(key)!;
      const amount = parseFloat(result.total || '0');
      
      if (result.type === 'income') {
        monthData.total_income = amount;
      } else {
        monthData.total_expenses = amount;
      }
    });

    const monthly_trends = Array.from(monthlyMap.values()).map(trend => ({
      ...trend,
      net_amount: trend.total_income - trend.total_expenses
    }));

    // Get overall totals
    let totalResults;
    if (dateConditions.length > 0) {
      totalResults = await db
        .select({
          type: transactionsTable.type,
          total: sum(transactionsTable.amount).as('total')
        })
        .from(transactionsTable)
        .where(and(...dateConditions))
        .groupBy(transactionsTable.type)
        .execute();
    } else {
      totalResults = await db
        .select({
          type: transactionsTable.type,
          total: sum(transactionsTable.amount).as('total')
        })
        .from(transactionsTable)
        .groupBy(transactionsTable.type)
        .execute();
    }
    
    let total_income = 0;
    let total_expenses = 0;
    
    totalResults.forEach(result => {
      const amount = parseFloat(result.total || '0');
      if (result.type === 'income') {
        total_income = amount;
      } else {
        total_expenses = amount;
      }
    });

    const net_amount = total_income - total_expenses;

    // Get budget status
    let budgetResults;
    if (query.month && query.year) {
      budgetResults = await db
        .select({
          category_id: budgetsTable.category_id,
          category_name: categoriesTable.name,
          budget_limit: budgetsTable.monthly_limit,
          month: budgetsTable.month,
          year: budgetsTable.year
        })
        .from(budgetsTable)
        .innerJoin(categoriesTable, eq(budgetsTable.category_id, categoriesTable.id))
        .where(
          and(
            eq(budgetsTable.month, query.month),
            eq(budgetsTable.year, query.year)
          )
        )
        .execute();
    } else {
      budgetResults = await db
        .select({
          category_id: budgetsTable.category_id,
          category_name: categoriesTable.name,
          budget_limit: budgetsTable.monthly_limit,
          month: budgetsTable.month,
          year: budgetsTable.year
        })
        .from(budgetsTable)
        .innerJoin(categoriesTable, eq(budgetsTable.category_id, categoriesTable.id))
        .execute();
    }

    // Calculate spent amounts for each budget
    const budget_status = await Promise.all(
      budgetResults.map(async (budget) => {
        // Get spent amount for this category in the budget period
        const spentResult = await db
          .select({
            spent: sum(transactionsTable.amount).as('spent')
          })
          .from(transactionsTable)
          .where(
            and(
              eq(transactionsTable.category_id, budget.category_id),
              eq(transactionsTable.type, 'expense'),
              sql`EXTRACT(MONTH FROM ${transactionsTable.transaction_date}) = ${budget.month}`,
              sql`EXTRACT(YEAR FROM ${transactionsTable.transaction_date}) = ${budget.year}`
            )
          )
          .execute();

        const spent_amount = parseFloat(spentResult[0]?.spent || '0');
        const budget_limit = parseFloat(budget.budget_limit);
        const remaining_amount = budget_limit - spent_amount;
        const percentage_used = budget_limit > 0 ? (spent_amount / budget_limit) * 100 : 0;

        return {
          category_id: budget.category_id,
          category_name: budget.category_name,
          budget_limit,
          spent_amount,
          remaining_amount,
          percentage_used
        };
      })
    );

    return {
      category_spending,
      monthly_trends,
      total_income,
      total_expenses,
      net_amount,
      budget_status
    };
  } catch (error) {
    console.error('Dashboard data retrieval failed:', error);
    throw error;
  }
}
