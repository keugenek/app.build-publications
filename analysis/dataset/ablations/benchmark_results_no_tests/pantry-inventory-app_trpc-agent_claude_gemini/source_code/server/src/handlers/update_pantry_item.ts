import { db } from '../db';
import { pantryItemsTable } from '../db/schema';
import { type UpdatePantryItemInput, type PantryItem } from '../schema';
import { eq } from 'drizzle-orm';

export const updatePantryItem = async (input: UpdatePantryItemInput): Promise<PantryItem> => {
  try {
    // Build update object with only provided fields
    const updateData: any = {
      updated_at: new Date() // Always update the timestamp
    };

    if (input.name !== undefined) {
      updateData.name = input.name;
    }

    if (input.quantity !== undefined) {
      updateData.quantity = input.quantity; // real column accepts numbers directly
    }

    if (input.expiry_date !== undefined) {
      updateData.expiry_date = input.expiry_date.toISOString().split('T')[0]; // Convert Date to YYYY-MM-DD string
    }

    // Update the item and return the updated record
    const result = await db.update(pantryItemsTable)
      .set(updateData)
      .where(eq(pantryItemsTable.id, input.id))
      .returning()
      .execute();

    // Check if item was found and updated
    if (result.length === 0) {
      throw new Error(`Pantry item with ID ${input.id} not found`);
    }

    // Convert fields back to expected types before returning
    const updatedItem = result[0];
    return {
      ...updatedItem,
      expiry_date: new Date(updatedItem.expiry_date) // Convert string back to Date
    };
  } catch (error) {
    console.error('Pantry item update failed:', error);
    throw error;
  }
};
