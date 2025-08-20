import { db } from '../db';
import { categoriesTable, transactionsTable, budgetsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export async function deleteCategory(id: number): Promise<{ success: boolean }> {
  try {
    // First check if category exists
    const existingCategory = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, id))
      .execute();

    if (existingCategory.length === 0) {
      throw new Error(`Category with id ${id} not found`);
    }

    // Check if there are any transactions using this category
    const relatedTransactions = await db.select()
      .from(transactionsTable)
      .where(eq(transactionsTable.category_id, id))
      .execute();

    if (relatedTransactions.length > 0) {
      throw new Error(`Cannot delete category with existing transactions. Found ${relatedTransactions.length} related transactions.`);
    }

    // Check if there are any budgets using this category
    const relatedBudgets = await db.select()
      .from(budgetsTable)
      .where(eq(budgetsTable.category_id, id))
      .execute();

    if (relatedBudgets.length > 0) {
      throw new Error(`Cannot delete category with existing budgets. Found ${relatedBudgets.length} related budgets.`);
    }

    // Delete the category
    await db.delete(categoriesTable)
      .where(eq(categoriesTable.id, id))
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Category deletion failed:', error);
    throw error;
  }
}
