import { db } from '../db';
import { budgetsTable } from '../db/schema';
import { type UpdateBudgetInput, type Budget } from '../schema';
import { eq } from 'drizzle-orm';

export const updateBudget = async (input: UpdateBudgetInput): Promise<Budget> => {
  try {
    // Build the update data object with only provided fields
    const updateData: any = {};
    
    if (input.category !== undefined) {
      updateData.category = input.category;
    }
    
    if (input.amount !== undefined) {
      updateData.amount = input.amount.toString(); // Convert number to string for numeric column
    }
    
    if (input.month !== undefined) {
      updateData.month = input.month;
    }
    
    if (input.year !== undefined) {
      updateData.year = input.year;
    }

    // Update budget record
    const result = await db.update(budgetsTable)
      .set(updateData)
      .where(eq(budgetsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Budget with id ${input.id} not found`);
    }

    // Convert numeric fields back to numbers before returning
    const budget = result[0];
    return {
      ...budget,
      amount: parseFloat(budget.amount) // Convert string back to number
    };
  } catch (error) {
    console.error('Budget update failed:', error);
    throw error;
  }
};
