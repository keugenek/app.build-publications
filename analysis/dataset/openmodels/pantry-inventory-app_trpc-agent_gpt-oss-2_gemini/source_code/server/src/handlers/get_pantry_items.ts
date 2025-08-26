import { db } from '../db';
import { pantryItemsTable } from '../db/schema';
import { type PantryItem } from '../schema';

/**
 * Handler for retrieving all pantry items.
 * Returns an array of PantryItem objects from the database.
 */
export const getPantryItems = async (): Promise<PantryItem[]> => {
  try {
    const results = await db.select().from(pantryItemsTable).execute();
    // Drizzle returns Date objects for timestamp columns, and numbers for integer columns.
    // The schema expects the same types, so we can return the results directly.
    return results.map(item => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      expiry_date: item.expiry_date,
      created_at: item.created_at,
    }));
  } catch (error) {
    console.error('Failed to get pantry items:', error);
    throw error;
  }
};
