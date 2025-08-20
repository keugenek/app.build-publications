import { db } from '../db';
import { budgetsTable, categoriesTable } from '../db/schema';
import { type UpdateBudgetInput, type Budget } from '../schema';
import { eq, and, ne } from 'drizzle-orm';

export const updateBudget = async (input: UpdateBudgetInput): Promise<Budget> => {
  try {
    // First, check if the budget exists
    const existingBudget = await db.select()
      .from(budgetsTable)
      .where(eq(budgetsTable.id, input.id))
      .execute();

    if (existingBudget.length === 0) {
      throw new Error(`Budget with id ${input.id} not found`);
    }

    // If category_id is being updated, validate it exists
    if (input.category_id !== undefined) {
      const categoryExists = await db.select()
        .from(categoriesTable)
        .where(eq(categoriesTable.id, input.category_id))
        .execute();

      if (categoryExists.length === 0) {
        throw new Error(`Category with id ${input.category_id} not found`);
      }
    }

    // Check for duplicate budget if category, month, or year is being changed
    if (input.category_id !== undefined || input.month !== undefined || input.year !== undefined) {
      const current = existingBudget[0];
      const newCategoryId = input.category_id ?? current.category_id;
      const newMonth = input.month ?? current.month;
      const newYear = input.year ?? current.year;

      // Only check for duplicates if the combination is actually changing
      if (newCategoryId !== current.category_id || newMonth !== current.month || newYear !== current.year) {
        const duplicateBudget = await db.select()
          .from(budgetsTable)
          .where(
            and(
              eq(budgetsTable.category_id, newCategoryId),
              eq(budgetsTable.month, newMonth),
              eq(budgetsTable.year, newYear),
              ne(budgetsTable.id, input.id) // Exclude current budget
            )
          )
          .execute();

        if (duplicateBudget.length > 0) {
          throw new Error(`Budget for category ${newCategoryId}, month ${newMonth}, year ${newYear} already exists`);
        }
      }
    }

    // Build update object with only provided fields
    const updateData: any = {};
    if (input.category_id !== undefined) {
      updateData.category_id = input.category_id;
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
      amount: parseFloat(budget.amount) // Convert string back to number
    };
  } catch (error) {
    console.error('Budget update failed:', error);
    throw error;
  }
};
