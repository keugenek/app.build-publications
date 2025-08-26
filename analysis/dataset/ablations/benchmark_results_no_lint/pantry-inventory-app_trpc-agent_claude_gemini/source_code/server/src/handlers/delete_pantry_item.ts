import { db } from '../db';
import { pantryItemsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const deletePantryItem = async (id: number): Promise<void> => {
  try {
    // First check if the item exists
    const existingItems = await db.select()
      .from(pantryItemsTable)
      .where(eq(pantryItemsTable.id, id))
      .execute();

    if (existingItems.length === 0) {
      throw new Error(`Pantry item with ID ${id} not found`);
    }

    // Delete the item
    await db.delete(pantryItemsTable)
      .where(eq(pantryItemsTable.id, id))
      .execute();
  } catch (error) {
    console.error('Pantry item deletion failed:', error);
    throw error;
  }
};
