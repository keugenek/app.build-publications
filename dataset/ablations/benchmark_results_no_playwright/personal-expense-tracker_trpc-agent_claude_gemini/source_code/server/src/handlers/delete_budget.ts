import { db } from '../db';
import { budgetsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const deleteBudget = async (id: number): Promise<boolean> => {
  try {
    const result = await db.delete(budgetsTable)
      .where(eq(budgetsTable.id, id))
      .returning()
      .execute();

    // Return true if a budget was deleted, false if no budget was found
    return result.length > 0;
  } catch (error) {
    console.error('Budget deletion failed:', error);
    throw error;
  }
};
