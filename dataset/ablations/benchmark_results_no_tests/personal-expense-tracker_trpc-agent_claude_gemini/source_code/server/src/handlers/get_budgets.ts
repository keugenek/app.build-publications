import { db } from '../db';
import { budgetsTable, categoriesTable } from '../db/schema';
import { type Budget } from '../schema';
import { eq, and } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';

export const getBudgets = async (year?: number, month?: number): Promise<Budget[]> => {
  try {
    // Build conditions array for optional filtering
    const conditions: SQL<unknown>[] = [];

    if (year !== undefined) {
      conditions.push(eq(budgetsTable.year, year));
    }

    if (month !== undefined) {
      conditions.push(eq(budgetsTable.month, month));
    }

    // Build query with or without where clause
    let query;
    if (conditions.length > 0) {
      query = db.select()
        .from(budgetsTable)
        .innerJoin(categoriesTable, eq(budgetsTable.category_id, categoriesTable.id))
        .where(conditions.length === 1 ? conditions[0] : and(...conditions));
    } else {
      query = db.select()
        .from(budgetsTable)
        .innerJoin(categoriesTable, eq(budgetsTable.category_id, categoriesTable.id));
    }

    // Execute query
    const results = await query.execute();

    // Convert numeric fields back to numbers and return Budget objects
    return results.map(result => ({
      id: result.budgets.id,
      category_id: result.budgets.category_id,
      amount: parseFloat(result.budgets.amount), // Convert numeric to number
      month: result.budgets.month,
      year: result.budgets.year,
      created_at: result.budgets.created_at
    }));
  } catch (error) {
    console.error('Get budgets failed:', error);
    throw error;
  }
};
