import { db } from '../db';
import { pantryItemsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type PantryItem } from '../schema';

/**
 * Deletes a pantry item by its ID.
 * Returns the deleted pantry item with proper type conversions.
 * Throws an error if the item does not exist.
 */
export const deletePantryItem = async (id: number): Promise<PantryItem> => {
  try {
    // First, fetch the item to return after deletion
    const items = await db.select()
      .from(pantryItemsTable)
      .where(eq(pantryItemsTable.id, id))
      .execute();

    if (items.length === 0) {
      throw new Error(`Pantry item with id ${id} not found`);
    }

    const item = items[0];

    // Delete the item
    await db.delete(pantryItemsTable)
      .where(eq(pantryItemsTable.id, id))
      .execute();

    // Convert numeric fields back to numbers
    return {
      ...item,
      quantity: parseFloat(item.quantity as unknown as string), // numeric stored as string
    } as PantryItem;
  } catch (error) {
    console.error('Failed to delete pantry item:', error);
    throw error;
  }
};
