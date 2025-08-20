import { db } from '../db';
import { pantryItemsTable } from '../db/schema';
import { type PantryItem } from '../schema';

export const getPantryItems = async (): Promise<PantryItem[]> => {
  try {
    const results = await db.select().from(pantryItemsTable).execute();
    // Convert numeric fields back to numbers
    return results.map(item => ({
      ...item,
      quantity: parseFloat(item.quantity as unknown as string), // numeric stored as string
      purchase_date: new Date(item.purchase_date as unknown as string),
      expiry_date: new Date(item.expiry_date as unknown as string),
    }));
  } catch (error) {
    console.error('Failed to fetch pantry items:', error);
    throw error;
  }
};
