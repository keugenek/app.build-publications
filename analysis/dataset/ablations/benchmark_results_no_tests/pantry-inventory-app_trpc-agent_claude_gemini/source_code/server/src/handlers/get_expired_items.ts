import { db } from '../db';
import { pantryItemsTable } from '../db/schema';
import { type PantryItemWithStatus } from '../schema';
import { lt, desc } from 'drizzle-orm';

export const getExpiredItems = async (): Promise<PantryItemWithStatus[]> => {
  try {
    const today = new Date();
    const todayString = today.toISOString().split('T')[0]; // Format as YYYY-MM-DD

    // Fetch items where expiry_date < current date
    const results = await db.select()
      .from(pantryItemsTable)
      .where(lt(pantryItemsTable.expiry_date, todayString))
      .orderBy(desc(pantryItemsTable.expiry_date)) // Most recently expired first
      .execute();

    // Transform results to include expiry status and days calculation
    return results.map(item => {
      const expiryDate = new Date(item.expiry_date);
      const timeDiff = expiryDate.getTime() - today.getTime();
      const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

      return {
        ...item,
        quantity: parseFloat(item.quantity.toString()), // Convert real to number
        expiry_date: expiryDate, // Convert string to Date
        expiry_status: 'expired' as const,
        days_until_expiry: daysDiff // Will be negative for expired items
      };
    });
  } catch (error) {
    console.error('Failed to fetch expired items:', error);
    throw error;
  }
};
