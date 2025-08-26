import { db } from '../db';
import { pantryItemsTable } from '../db/schema';
import { type PantryItem } from '../schema';
import { asc } from 'drizzle-orm';

export const getAllPantryItems = async (): Promise<PantryItem[]> => {
  try {
    // Query all pantry items ordered by expiry date (soonest first)
    const results = await db.select()
      .from(pantryItemsTable)
      .orderBy(asc(pantryItemsTable.expiry_date))
      .execute();

    // Convert numeric fields back to numbers and ensure proper date handling
    return results.map(item => ({
      ...item,
      quantity: parseFloat(item.quantity.toString()), // Convert real column to number
      expiry_date: new Date(item.expiry_date), // Ensure expiry_date is Date object
      created_at: new Date(item.created_at), // Ensure created_at is Date object
      updated_at: new Date(item.updated_at) // Ensure updated_at is Date object
    }));
  } catch (error) {
    console.error('Failed to get all pantry items:', error);
    throw error;
  }
};
