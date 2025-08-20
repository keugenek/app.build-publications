import { db } from '../db';
import { budgetsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const deleteBudget = async (id: number): Promise<{ success: boolean }> => {
  try {
    // Delete the budget record by id
    const result = await db.delete(budgetsTable)
      .where(eq(budgetsTable.id, id))
      .execute();

    // Return success based on whether any rows were affected
    return { success: (result.rowCount ?? 0) > 0 };
  } catch (error) {
    console.error('Budget deletion failed:', error);
    throw error;
  }
};
