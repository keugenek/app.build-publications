import { db } from '../db';
import { pantryItemsTable } from '../db/schema';
import { type UpdatePantryItemInput, type PantryItem } from '../schema';
import { eq } from 'drizzle-orm';

export const updatePantryItem = async (input: UpdatePantryItemInput): Promise<PantryItem> => {
  try {
    // Prepare update data, excluding undefined values and the id
    const updateData: any = {};
    
    if (input.name !== undefined) updateData.name = input.name;
    if (input.quantity !== undefined) updateData.quantity = input.quantity;
    if (input.expiry_date !== undefined) updateData.expiry_date = input.expiry_date;
    if (input.category !== undefined) updateData.category = input.category;
    
    // Always update the updated_at timestamp
    updateData.updated_at = new Date();

    // Update the pantry item
    const result = await db.update(pantryItemsTable)
      .set(updateData)
      .where(eq(pantryItemsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Pantry item with id ${input.id} not found`);
    }

    // Convert date strings back to Date objects before returning
    const item = result[0];
    return {
      ...item,
      expiry_date: new Date(item.expiry_date),
      created_at: new Date(item.created_at),
      updated_at: new Date(item.updated_at)
    } as PantryItem;
  } catch (error) {
    console.error('Pantry item update failed:', error);
    throw error;
  }
};
