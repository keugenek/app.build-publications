import { eq } from 'drizzle-orm';
import { db } from '../db';
import { pantryItemsTable } from '../db/schema';

export const deletePantryItem = async (id: number): Promise<boolean> => {
  try {
    const result = await db.delete(pantryItemsTable)
      .where(eq(pantryItemsTable.id, id))
      .execute();
    
    // Return true if a row was deleted, false otherwise
    return (result.rowCount ?? 0) > 0;
  } catch (error) {
    console.error('Failed to delete pantry item:', error);
    throw error;
  }
};
