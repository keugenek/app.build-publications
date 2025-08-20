import { db } from '../db';
import { budgetsTable, categoriesTable } from '../db/schema';
import { type CreateBudgetInput, type Budget } from '../schema';
import { eq, and } from 'drizzle-orm';

export const createBudget = async (input: CreateBudgetInput): Promise<Budget> => {
  try {
    // Validate that category exists
    const categoryExists = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, input.category_id))
      .execute();

    if (categoryExists.length === 0) {
      throw new Error(`Category with id ${input.category_id} does not exist`);
    }

    // Check for duplicate budget for same category/month/year
    const existingBudget = await db.select()
      .from(budgetsTable)
      .where(and(
        eq(budgetsTable.category_id, input.category_id),
        eq(budgetsTable.month, input.month),
        eq(budgetsTable.year, input.year)
      ))
      .execute();

    if (existingBudget.length > 0) {
      throw new Error(`Budget already exists for category ${input.category_id} in ${input.month}/${input.year}`);
    }

    // Insert budget record
    const result = await db.insert(budgetsTable)
      .values({
        category_id: input.category_id,
        monthly_limit: input.monthly_limit.toString(), // Convert number to string for numeric column
        month: input.month,
        year: input.year
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const budget = result[0];
    return {
      ...budget,
      monthly_limit: parseFloat(budget.monthly_limit) // Convert string back to number
    };
  } catch (error) {
    console.error('Budget creation failed:', error);
    throw error;
  }
};
