import { db } from '../db';
import { pantryItemsTable } from '../db/schema';
import { type DeletePantryItemInput } from '../schema';
import { eq } from 'drizzle-orm';

export async function deletePantryItem(input: DeletePantryItemInput): Promise<{ success: boolean }> {
  try {
    // Check if the item exists first
    const existingItems = await db.select()
      .from(pantryItemsTable)
      .where(eq(pantryItemsTable.id, input.id))
      .execute();

    if (existingItems.length === 0) {
      throw new Error(`Pantry item with id ${input.id} not found`);
    }

    // Delete the item
    const result = await db.delete(pantryItemsTable)
      .where(eq(pantryItemsTable.id, input.id))
      .returning()
      .execute();

    // Verify deletion was successful
    if (result.length === 0) {
      throw new Error('Failed to delete pantry item');
    }

    return { success: true };
  } catch (error) {
    console.error('Pantry item deletion failed:', error);
    throw error;
  }
}
