import { db } from '../db';
import { budgetsTable, categoriesTable } from '../db/schema';
import { type CreateBudgetInput, type Budget } from '../schema';
import { eq, and } from 'drizzle-orm';

export const createBudget = async (input: CreateBudgetInput): Promise<Budget> => {
  try {
    // First, verify that the category exists
    const categoryExists = await db.select({ id: categoriesTable.id })
      .from(categoriesTable)
      .where(eq(categoriesTable.id, input.category_id))
      .limit(1)
      .execute();

    if (categoryExists.length === 0) {
      throw new Error(`Category with id ${input.category_id} does not exist`);
    }

    // Check for existing budget for the same category/month/year combination
    const existingBudget = await db.select()
      .from(budgetsTable)
      .where(
        and(
          eq(budgetsTable.category_id, input.category_id),
          eq(budgetsTable.month, input.month),
          eq(budgetsTable.year, input.year)
        )
      )
      .limit(1)
      .execute();

    if (existingBudget.length > 0) {
      throw new Error(`Budget for category ${input.category_id} in ${input.month}/${input.year} already exists`);
    }

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

    // Convert numeric field back to number before returning
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
