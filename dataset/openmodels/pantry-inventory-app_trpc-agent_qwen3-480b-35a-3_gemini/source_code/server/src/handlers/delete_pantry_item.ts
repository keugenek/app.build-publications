import { db } from '../db';
import { pantryItemsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const deletePantryItem = async (id: number): Promise<boolean> => {
  try {
    const result = await db.delete(pantryItemsTable)
      .where(eq(pantryItemsTable.id, id))
      .returning()
      .execute();
    
    // Return true if an item was deleted, false otherwise
    return result.length > 0;
  } catch (error) {
    console.error('Failed to delete pantry item:', error);
    throw error;
  }
};
