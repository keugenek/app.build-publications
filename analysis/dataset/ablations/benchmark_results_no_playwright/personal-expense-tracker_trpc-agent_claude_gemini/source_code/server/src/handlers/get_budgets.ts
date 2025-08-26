import { db } from '../db';
import { budgetsTable, categoriesTable } from '../db/schema';
import { type Budget } from '../schema';
import { eq, and, SQL } from 'drizzle-orm';

export const getBudgets = async (month?: number, year?: number): Promise<Budget[]> => {
  try {
    // If no filters provided, use current month and year
    const now = new Date();
    const filterMonth = month ?? now.getMonth() + 1; // getMonth() returns 0-11
    const filterYear = year ?? now.getFullYear();

    // Build conditions array for filtering
    const conditions: SQL<unknown>[] = [];
    
    conditions.push(eq(budgetsTable.month, filterMonth));
    conditions.push(eq(budgetsTable.year, filterYear));

    // Start with base query joining budgets and categories
    const query = db.select({
      id: budgetsTable.id,
      category_id: budgetsTable.category_id,
      monthly_limit: budgetsTable.monthly_limit,
      month: budgetsTable.month,
      year: budgetsTable.year,
      created_at: budgetsTable.created_at
    })
    .from(budgetsTable)
    .innerJoin(categoriesTable, eq(budgetsTable.category_id, categoriesTable.id))
    .where(and(...conditions));

    const results = await query.execute();

    // Convert numeric fields back to numbers
    return results.map(budget => ({
      ...budget,
      monthly_limit: parseFloat(budget.monthly_limit)
    }));
  } catch (error) {
    console.error('Get budgets failed:', error);
    throw error;
  }
};
