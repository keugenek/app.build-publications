import { db } from '../db';
import { budgetsTable } from '../db/schema';
import { type CreateBudgetInput, type Budget } from '../schema';

export const createBudget = async (input: CreateBudgetInput): Promise<Budget> => {
  try {
    // Insert budget record
    const result = await db.insert(budgetsTable)
      .values({
        category_id: input.category_id,
        amount: input.amount.toString(), // Convert number to string for numeric column
        month: input.month,
        year: input.year
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const budget = result[0];
    return {
      ...budget,
      amount: parseFloat(budget.amount) // Convert string back to number
    };
  } catch (error) {
    console.error('Budget creation failed:', error);
    throw error;
  }
};
