import { db } from '../db';
import { pantryItemsTable } from '../db/schema';
import { type CreatePantryItemInput, type PantryItem } from '../schema';

export const createPantryItem = async (input: CreatePantryItemInput): Promise<PantryItem> => {
  try {
    // Insert pantry item record
    const result = await db.insert(pantryItemsTable)
      .values({
        name: input.name,
        quantity: input.quantity.toString(), // Convert number to string for numeric column
        unit: input.unit,
        expiration_date: input.expiration_date.toISOString().split('T')[0], // Convert Date to YYYY-MM-DD string
        category: input.category || null,
        notes: input.notes || null
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers and date strings to Date objects before returning
    const pantryItem = result[0];
    return {
      ...pantryItem,
      quantity: parseFloat(pantryItem.quantity), // Convert string back to number
      expiration_date: new Date(pantryItem.expiration_date), // Convert string back to Date
      created_at: pantryItem.created_at,
      updated_at: pantryItem.updated_at
    };
  } catch (error) {
    console.error('Pantry item creation failed:', error);
    throw error;
  }
};
