import { db } from '../db';
import { pantryItemsTable } from '../db/schema';
import { type UpdatePantryItemInput, type PantryItem } from '../schema';
import { eq } from 'drizzle-orm';

export async function updatePantryItem(input: UpdatePantryItemInput): Promise<PantryItem> {
  try {
    // First check if the item exists
    const existingItems = await db.select()
      .from(pantryItemsTable)
      .where(eq(pantryItemsTable.id, input.id))
      .execute();

    if (existingItems.length === 0) {
      throw new Error(`Pantry item with id ${input.id} not found`);
    }

    // Build the update object with only provided fields
    const updateData: any = {
      updated_at: new Date() // Always update the timestamp
    };

    if (input.name !== undefined) {
      updateData.name = input.name;
    }

    if (input.quantity !== undefined) {
      updateData.quantity = input.quantity.toString(); // Convert number to string for numeric column
    }

    if (input.expiry_date !== undefined) {
      updateData.expiry_date = input.expiry_date;
    }

    // Update the item and return the updated record
    const result = await db.update(pantryItemsTable)
      .set(updateData)
      .where(eq(pantryItemsTable.id, input.id))
      .returning()
      .execute();

    // Convert numeric and date fields back to proper types before returning
    const updatedItem = result[0];
    return {
      ...updatedItem,
      quantity: parseFloat(updatedItem.quantity), // Convert string back to number
      expiry_date: new Date(updatedItem.expiry_date) // Convert string back to Date
    };
  } catch (error) {
    console.error('Pantry item update failed:', error);
    throw error;
  }
}
