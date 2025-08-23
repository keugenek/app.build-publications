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
        expiry_date: input.expiry_date.toISOString().split('T')[0], // Convert Date to YYYY-MM-DD string
        category: input.category
      })
      .returning()
      .execute();

    // Return the created item
    const item = result[0];
    return {
      ...item,
      expiry_date: new Date(item.expiry_date), // Ensure proper date conversion
      created_at: new Date(item.created_at),
      updated_at: new Date(item.updated_at)
    };
  } catch (error) {
    console.error('Pantry item creation failed:', error);
    throw error;
  }
};
