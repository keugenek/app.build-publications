import { db } from '../db';
import { budgetsTable } from '../db/schema';
import { type UpdateBudgetInput, type Budget } from '../schema';
import { eq } from 'drizzle-orm';

export const updateBudget = async (input: UpdateBudgetInput): Promise<Budget> => {
  try {
    // First, verify the budget exists
    const existingBudget = await db.select()
      .from(budgetsTable)
      .where(eq(budgetsTable.id, input.id))
      .execute();

    if (existingBudget.length === 0) {
      throw new Error(`Budget with id ${input.id} not found`);
    }

    // Build update object with only provided fields
    const updateData: Partial<typeof budgetsTable.$inferInsert> = {};

    if (input.monthly_limit !== undefined) {
      updateData.monthly_limit = input.monthly_limit.toString();
    }
    
    if (input.month !== undefined) {
      updateData.month = input.month;
    }
    
    if (input.year !== undefined) {
      updateData.year = input.year;
    }

    // Update the budget
    const result = await db.update(budgetsTable)
      .set(updateData)
      .where(eq(budgetsTable.id, input.id))
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const budget = result[0];
    return {
      ...budget,
      monthly_limit: parseFloat(budget.monthly_limit)
    };
  } catch (error) {
    console.error('Budget update failed:', error);
    throw error;
  }
};
