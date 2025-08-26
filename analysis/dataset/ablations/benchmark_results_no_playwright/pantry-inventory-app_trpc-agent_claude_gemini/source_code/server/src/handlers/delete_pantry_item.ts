import { db } from '../db';
import { pantryItemsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const deletePantryItem = async (id: number): Promise<{ success: boolean }> => {
  try {
    // Delete the pantry item - notifications will cascade delete due to foreign key constraint
    const result = await db.delete(pantryItemsTable)
      .where(eq(pantryItemsTable.id, id))
      .returning({ id: pantryItemsTable.id })
      .execute();

    // Check if any rows were affected (item existed and was deleted)
    return { success: result.length > 0 };
  } catch (error) {
    console.error('Pantry item deletion failed:', error);
    throw error;
  }
};
