import { db } from '../db';
import { pantryItemsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const deletePantryItem = async (id: number): Promise<{ success: boolean }> => {
  try {
    // Delete the pantry item by ID
    const result = await db.delete(pantryItemsTable)
      .where(eq(pantryItemsTable.id, id))
      .returning()
      .execute();

    // Check if any rows were affected (item existed and was deleted)
    if (result.length === 0) {
      throw new Error(`Pantry item with ID ${id} not found`);
    }

    return { success: true };
  } catch (error) {
    console.error('Pantry item deletion failed:', error);
    throw error;
  }
};
