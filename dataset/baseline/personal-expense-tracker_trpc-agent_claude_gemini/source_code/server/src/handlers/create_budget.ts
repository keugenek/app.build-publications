import { db } from '../db';
import { budgetsTable, categoriesTable } from '../db/schema';
import { type CreateBudgetInput, type Budget } from '../schema';
import { eq, and } from 'drizzle-orm';

export async function createBudget(input: CreateBudgetInput): Promise<Budget> {
  try {
    // Verify that the category exists
    const categoryExists = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, input.category_id))
      .execute();
    
    if (categoryExists.length === 0) {
      throw new Error(`Category with id ${input.category_id} does not exist`);
    }

    // Check if a budget already exists for this category/month/year
    const existingBudget = await db.select()
      .from(budgetsTable)
      .where(and(
        eq(budgetsTable.category_id, input.category_id),
        eq(budgetsTable.month, input.month),
        eq(budgetsTable.year, input.year)
      ))
      .execute();

    let result;

    if (existingBudget.length > 0) {
      // Update existing budget
      const updateResult = await db.update(budgetsTable)
        .set({
          amount: input.amount.toString(),
          updated_at: new Date()
        })
        .where(eq(budgetsTable.id, existingBudget[0].id))
        .returning()
        .execute();
      
      result = updateResult[0];
    } else {
      // Insert new budget
      const insertResult = await db.insert(budgetsTable)
        .values({
          category_id: input.category_id,
          amount: input.amount.toString(),
          month: input.month,
          year: input.year
        })
        .returning()
        .execute();
      
      result = insertResult[0];
    }

    // Convert numeric fields back to numbers before returning
    return {
      ...result,
      amount: parseFloat(result.amount)
    };
  } catch (error) {
    console.error('Budget creation/update failed:', error);
    throw error;
  }
}
