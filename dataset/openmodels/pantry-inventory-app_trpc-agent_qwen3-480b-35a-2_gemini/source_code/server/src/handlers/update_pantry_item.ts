import { db } from '../db';
import { pantryItemsTable } from '../db/schema';
import { type UpdatePantryItemInput, type PantryItem } from '../schema';
import { eq } from 'drizzle-orm';

export const updatePantryItem = async (input: UpdatePantryItemInput): Promise<PantryItem> => {
  try {
    // Build the update data dynamically based on provided fields
    const updateData: any = {
      updated_at: new Date()
    };
    
    if (input.name !== undefined) {
      updateData.name = input.name;
    }
    
    if (input.quantity !== undefined) {
      updateData.quantity = input.quantity;
    }
    
    if (input.expiry_date !== undefined) {
      updateData.expiry_date = input.expiry_date;
    }

    // Update the pantry item
    const result = await db.update(pantryItemsTable)
      .set(updateData)
      .where(eq(pantryItemsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Pantry item with id ${input.id} not found`);
    }

    // Return the updated item
    const updatedItem = result[0];
    return {
      ...updatedItem,
      expiry_date: new Date(updatedItem.expiry_date),
      created_at: new Date(updatedItem.created_at),
      updated_at: new Date(updatedItem.updated_at)
    };
  } catch (error) {
    console.error('Failed to update pantry item:', error);
    throw error;
  }
};
