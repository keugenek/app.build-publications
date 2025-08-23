import { db } from '../db';
import { pantryItemsTable } from '../db/schema';
import { type CreatePantryItemInput, type PantryItem } from '../schema';

export const createPantryItem = async (input: CreatePantryItemInput): Promise<PantryItem> => {
  try {
    // Insert pantry item record
    const result = await db.insert(pantryItemsTable)
      .values({
        name: input.name,
        quantity: input.quantity,
        expiry_date: input.expiry_date.toISOString().split('T')[0], // Convert Date to string in YYYY-MM-DD format
      })
      .returning()
      .execute();

    // Return the created pantry item
    const pantryItem = result[0];
    return {
      id: pantryItem.id,
      name: pantryItem.name,
      quantity: pantryItem.quantity,
      expiry_date: new Date(pantryItem.expiry_date), // Convert string back to Date
      created_at: pantryItem.created_at,
      updated_at: pantryItem.updated_at,
    };
  } catch (error) {
    console.error('Pantry item creation failed:', error);
    throw error;
  }
};
