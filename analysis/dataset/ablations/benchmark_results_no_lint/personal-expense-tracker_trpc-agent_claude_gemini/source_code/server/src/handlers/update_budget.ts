import { db } from '../db';
import { budgetsTable, categoriesTable } from '../db/schema';
import { type UpdateBudgetInput, type Budget } from '../schema';
import { eq } from 'drizzle-orm';

export async function updateBudget(input: UpdateBudgetInput): Promise<Budget> {
  try {
    // First, check if the budget exists
    const existingBudget = await db.select()
      .from(budgetsTable)
      .where(eq(budgetsTable.id, input.id))
      .execute();

    if (existingBudget.length === 0) {
      throw new Error(`Budget with id ${input.id} not found`);
    }

    // Prepare the update values - only include fields that were provided
    const updateValues: Partial<typeof budgetsTable.$inferInsert> = {
      updated_at: new Date()
    };

    if (input.monthly_limit !== undefined) {
      updateValues.monthly_limit = input.monthly_limit.toString();
    }
    
    if (input.month !== undefined) {
      updateValues.month = input.month;
    }
    
    if (input.year !== undefined) {
      updateValues.year = input.year;
    }

    // Update the budget
    const result = await db.update(budgetsTable)
      .set(updateValues)
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
}
