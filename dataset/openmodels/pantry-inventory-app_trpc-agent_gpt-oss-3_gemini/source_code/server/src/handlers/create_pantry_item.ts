import { db } from '../db';
import { pantryItemsTable } from '../db/schema';
import { type CreatePantryItemInput, type PantryItem } from '../schema';

/**
 * Creates a pantry item in the database and returns the created record.
 * Handles conversion for numeric fields as per project conventions.
 */
export const createPantryItem = async (
  input: CreatePantryItemInput,
): Promise<PantryItem> => {
  try {
    // Insert the pantry item, converting numeric fields to strings for DB storage
    const result = await db
      .insert(pantryItemsTable)
      .values({
        name: input.name,
        quantity: input.quantity.toString(), // numeric column stored as string
        unit: input.unit,
        expiry_date: input.expiry_date,
      })
      .returning()
      .execute();

    // The DB returns quantity as string; convert back to number before returning
    const item = result[0];
    return {
      ...item,
      quantity: parseFloat(item.quantity as unknown as string),
    } as PantryItem;
  } catch (error) {
    console.error('Pantry item creation failed:', error);
    throw error;
  }
};
