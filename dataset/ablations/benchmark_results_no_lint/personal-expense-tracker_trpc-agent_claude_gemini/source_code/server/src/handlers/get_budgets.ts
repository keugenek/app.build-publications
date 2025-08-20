import { db } from '../db';
import { budgetsTable } from '../db/schema';
import { type Budget } from '../schema';

export async function getBudgets(): Promise<Budget[]> {
  try {
    // Fetch all budgets from database
    const results = await db.select()
      .from(budgetsTable)
      .execute();

    // Convert numeric fields back to numbers before returning
    return results.map(budget => ({
      ...budget,
      monthly_limit: parseFloat(budget.monthly_limit) // Convert string back to number
    }));
  } catch (error) {
    console.error('Failed to fetch budgets:', error);
    throw error;
  }
}
