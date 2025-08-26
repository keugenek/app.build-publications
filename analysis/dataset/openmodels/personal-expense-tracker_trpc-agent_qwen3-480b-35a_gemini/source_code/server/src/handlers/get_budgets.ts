import { db } from '../db';
import { budgetsTable } from '../db/schema';
import { type Budget } from '../schema';

export const getBudgets = async (): Promise<Budget[]> => {
  try {
    const results = await db.select()
      .from(budgetsTable)
      .execute();

    // Convert numeric fields back to numbers before returning
    return results.map(budget => ({
      ...budget,
      amount: parseFloat(budget.amount)
    }));
  } catch (error) {
    console.error('Failed to fetch budgets:', error);
    throw error;
  }
};
