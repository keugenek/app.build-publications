import { db } from '../db';
import { pantryItemsTable } from '../db/schema';
import { asc } from 'drizzle-orm';
import { type PantryItem } from '../schema';

export const getPantryItems = async (): Promise<PantryItem[]> => {
  try {
    // Fetch all pantry items from database, sorted by expiry date (soonest first)
    const results = await db.select()
      .from(pantryItemsTable)
      .orderBy(asc(pantryItemsTable.expiry_date))
      .execute();

    // Transform results and compute expiry status
    return results.map(item => {
      const currentDate = new Date();
      // Reset time to start of day for consistent day calculations
      currentDate.setHours(0, 0, 0, 0);
      
      const expiryDate = new Date(item.expiry_date);
      // Reset expiry date to start of day for consistent comparison
      expiryDate.setHours(0, 0, 0, 0);
      
      // Calculate days until expiry (can be negative if expired)
      const timeDiff = expiryDate.getTime() - currentDate.getTime();
      const daysUntilExpiry = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
      
      // Determine if item is expired (only if expiry date is in the past)
      const isExpired = daysUntilExpiry < 0;

      return {
        id: item.id,
        name: item.name,
        quantity: parseFloat(item.quantity), // Convert numeric to number
        unit: item.unit,
        expiry_date: item.expiry_date,
        added_date: item.added_date,
        is_expired: isExpired,
        days_until_expiry: daysUntilExpiry
      };
    });
  } catch (error) {
    console.error('Failed to fetch pantry items:', error);
    throw error;
  }
};
