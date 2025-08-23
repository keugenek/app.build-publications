import { db } from '../db';
import { pantryItemsTable } from '../db/schema';
import { type PantryItem } from '../schema';

export const getPantryItems = async (): Promise<PantryItem[]> => {
  try {
    // Fetch all pantry items from the database
    const results = await db.select()
      .from(pantryItemsTable)
      .orderBy(pantryItemsTable.name)
      .execute();

    // Convert date fields and return
    return results.map(item => ({
      ...item,
      quantity: item.quantity, // Integer field - no conversion needed
      expiry_date: new Date(item.expiry_date), // Convert string to Date
      created_at: item.created_at, // Timestamp field - already Date object
      updated_at: item.updated_at // Timestamp field - already Date object
    }));
  } catch (error) {
    console.error('Failed to fetch pantry items:', error);
    throw error;
  }
};
