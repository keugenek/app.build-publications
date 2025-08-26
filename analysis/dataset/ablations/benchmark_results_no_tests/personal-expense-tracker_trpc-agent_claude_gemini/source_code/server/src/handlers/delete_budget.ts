import { db } from '../db';
import { budgetsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const deleteBudget = async (id: number): Promise<{ success: boolean }> => {
  try {
    // First check if budget exists
    const existingBudget = await db.select()
      .from(budgetsTable)
      .where(eq(budgetsTable.id, id))
      .execute();

    if (existingBudget.length === 0) {
      throw new Error(`Budget with id ${id} not found`);
    }

    // Delete the budget
    await db.delete(budgetsTable)
      .where(eq(budgetsTable.id, id))
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Budget deletion failed:', error);
    throw error;
  }
};
