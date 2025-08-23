import { db } from '../db';
import { pantryItemsTable } from '../db/schema';
import { type PantryItem } from '../schema';

export const getPantryItems = async (): Promise<PantryItem[]> => {
  try {
    const results = await db.select()
      .from(pantryItemsTable)
      .orderBy(pantryItemsTable.name)
      .execute();

    // Convert date strings back to Date objects and return
    return results.map(item => ({
      ...item,
      expiry_date: new Date(item.expiry_date),
      created_at: new Date(item.created_at),
      updated_at: new Date(item.updated_at)
    }));
  } catch (error) {
    console.error('Failed to fetch pantry items:', error);
    throw error;
  }
};
