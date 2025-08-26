import { db } from '../db';
import { pantryItemsTable } from '../db/schema';
import { type PantryItem } from '../schema';
import { and, lte, gte } from 'drizzle-orm';

export const getExpiringItems = async (days?: number): Promise<PantryItem[]> => {
  try {
    // Default to 7 days if not provided
    const daysThreshold = days ?? 7;
    
    // Calculate the date threshold
    const today = new Date();
    const thresholdDate = new Date(today);
    thresholdDate.setDate(today.getDate() + daysThreshold);
    
    // Format dates as strings for database queries
    const todayStr = today.toISOString().split('T')[0];
    const thresholdDateStr = thresholdDate.toISOString().split('T')[0];
    
    // Query items that are expiring within the specified days
    const results = await db.select()
      .from(pantryItemsTable)
      .where(
        and(
          gte(pantryItemsTable.expiry_date, todayStr),
          lte(pantryItemsTable.expiry_date, thresholdDateStr)
        )
      )
      .orderBy(pantryItemsTable.expiry_date)
      .execute();
    
    // Convert date strings back to Date objects
    return results.map(item => ({
      ...item,
      expiry_date: new Date(item.expiry_date),
      created_at: new Date(item.created_at),
      updated_at: new Date(item.updated_at)
    }));
  } catch (error) {
    console.error('Fetching expiring items failed:', error);
    throw error;
  }
};
