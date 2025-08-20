import { db } from '../db';
import { pantryItemsTable } from '../db/schema';
import { type UpdatePantryItemInput, type PantryItem } from '../schema';
import { eq } from 'drizzle-orm';

export const updatePantryItem = async (input: UpdatePantryItemInput): Promise<PantryItem> => {
  try {
    // First, check if the item exists
    const existingItem = await db.select()
      .from(pantryItemsTable)
      .where(eq(pantryItemsTable.id, input.id))
      .execute();

    if (existingItem.length === 0) {
      throw new Error(`Pantry item with id ${input.id} not found`);
    }

    // Build the update object with only provided fields
    const updateData: any = {
      updated_at: new Date()
    };

    if (input.name !== undefined) {
      updateData.name = input.name;
    }
    if (input.quantity !== undefined) {
      updateData.quantity = input.quantity.toString(); // Convert number to string for numeric column
    }
    if (input.unit !== undefined) {
      updateData.unit = input.unit;
    }
    if (input.expiration_date !== undefined) {
      updateData.expiration_date = input.expiration_date;
    }
    if (input.category !== undefined) {
      updateData.category = input.category;
    }
    if (input.notes !== undefined) {
      updateData.notes = input.notes;
    }

    // Update the item
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
      expiration_date: new Date(updatedItem.expiration_date) // Convert string back to Date
    };
  } catch (error) {
    console.error('Pantry item update failed:', error);
    throw error;
  }
};
