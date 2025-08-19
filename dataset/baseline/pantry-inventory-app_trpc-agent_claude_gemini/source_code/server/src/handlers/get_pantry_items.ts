import { db } from '../db';
import { pantryItemsTable } from '../db/schema';
import { type PantryItem } from '../schema';
import { asc } from 'drizzle-orm';

export const getPantryItems = async (): Promise<PantryItem[]> => {
  try {
    // Query all pantry items ordered by name, then by expiry date
    const results = await db.select()
      .from(pantryItemsTable)
      .orderBy(asc(pantryItemsTable.name), asc(pantryItemsTable.expiry_date))
      .execute();

    // Convert numeric and date fields back to proper types before returning
    return results.map(item => ({
      ...item,
      quantity: parseFloat(item.quantity), // Convert string back to number
      expiry_date: new Date(item.expiry_date) // Convert string back to Date
    }));
  } catch (error) {
    console.error('Failed to get pantry items:', error);
    throw error;
  }
};
