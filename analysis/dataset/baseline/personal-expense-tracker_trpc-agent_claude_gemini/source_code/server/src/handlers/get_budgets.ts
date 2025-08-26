import { db } from '../db';
import { budgetsTable } from '../db/schema';
import { type Budget } from '../schema';
import { eq, and, type SQL } from 'drizzle-orm';

export async function getBudgets(month?: number, year?: number): Promise<Budget[]> {
  try {
    // Build conditions array for optional filters
    const conditions: SQL<unknown>[] = [];

    if (month !== undefined) {
      conditions.push(eq(budgetsTable.month, month));
    }

    if (year !== undefined) {
      conditions.push(eq(budgetsTable.year, year));
    }

    // Build and execute query
    let query = db.select().from(budgetsTable);
    
    const results = conditions.length > 0
      ? await query.where(conditions.length === 1 ? conditions[0] : and(...conditions)).execute()
      : await query.execute();

    // Convert numeric fields back to numbers
    return results.map(budget => ({
      ...budget,
      amount: parseFloat(budget.amount) // Convert string back to number
    }));
  } catch (error) {
    console.error('Failed to fetch budgets:', error);
    throw error;
  }
}
