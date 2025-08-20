import { db } from '../db';
import { pantryItemsTable } from '../db/schema';
import { type PantryItem } from '../schema';
import { asc } from 'drizzle-orm';

export const getPantryItems = async (): Promise<PantryItem[]> => {
  try {
    // Retrieve all pantry items, ordered by expiration date ascending (soonest to expire first)
    const results = await db.select()
      .from(pantryItemsTable)
      .orderBy(asc(pantryItemsTable.expiration_date), asc(pantryItemsTable.name))
      .execute();

    // Convert numeric quantity field back to number and date field to Date object
    return results.map(item => ({
      ...item,
      quantity: parseFloat(item.quantity),
      expiration_date: new Date(item.expiration_date)
    }));
  } catch (error) {
    console.error('Failed to retrieve pantry items:', error);
    throw error;
  }
};
