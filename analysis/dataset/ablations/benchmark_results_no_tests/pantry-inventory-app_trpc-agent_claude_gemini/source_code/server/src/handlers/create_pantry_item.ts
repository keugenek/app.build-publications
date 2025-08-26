import { db } from '../db';
import { pantryItemsTable } from '../db/schema';
import { type CreatePantryItemInput, type PantryItem } from '../schema';

export const createPantryItem = async (input: CreatePantryItemInput): Promise<PantryItem> => {
  try {
    // Insert pantry item record
    const result = await db.insert(pantryItemsTable)
      .values({
        name: input.name,
        quantity: input.quantity, // real column - no conversion needed for integers/floats
        expiry_date: input.expiry_date.toISOString().split('T')[0] // Convert Date to YYYY-MM-DD string for date column
      })
      .returning()
      .execute();

    // Return the created item with proper date conversion
    const item = result[0];
    return {
      ...item,
      expiry_date: new Date(item.expiry_date), // Convert date string back to Date object
      quantity: item.quantity // real column comes back as number, no conversion needed
    };
  } catch (error) {
    console.error('Pantry item creation failed:', error);
    throw error;
  }
};
