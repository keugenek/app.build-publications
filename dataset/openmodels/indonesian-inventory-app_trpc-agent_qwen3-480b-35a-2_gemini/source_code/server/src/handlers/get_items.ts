import { db } from '../db';
import { itemsTable } from '../db/schema';
import { type Item } from '../schema';

export const getItems = async (): Promise<Item[]> => {
  try {
    const results = await db.select().from(itemsTable).execute();
    
    // Convert integer fields and return items
    return results.map(item => ({
      ...item,
      stock: item.stock // Integer column - no conversion needed
    }));
  } catch (error) {
    console.error('Failed to fetch items:', error);
    throw error;
  }
};
