import { db } from '../db';
import { pantryItemsTable } from '../db/schema';
import { type GetItemsByExpiryInput, type PantryItemWithStatus } from '../schema';
import { asc } from 'drizzle-orm';

export const getItemsWithExpiryStatus = async (input: GetItemsByExpiryInput): Promise<PantryItemWithStatus[]> => {
  try {
    // Fetch all pantry items from database, ordered by expiry date
    const items = await db.select()
      .from(pantryItemsTable)
      .orderBy(asc(pantryItemsTable.expiry_date))
      .execute();

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison

    // Calculate expiry status for each item
    const itemsWithStatus: PantryItemWithStatus[] = items.map(item => {
      const expiryDate = new Date(item.expiry_date);
      expiryDate.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison
      
      // Calculate days until expiry (negative if expired, positive if fresh)
      const timeDiff = expiryDate.getTime() - today.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

      let expiryStatus: 'fresh' | 'expiring_soon' | 'expired';
      
      if (daysDiff < 0) {
        expiryStatus = 'expired';
      } else if (daysDiff <= input.days_ahead) {
        expiryStatus = 'expiring_soon';
      } else {
        expiryStatus = 'fresh';
      }

      return {
        id: item.id,
        name: item.name,
        quantity: parseFloat(item.quantity.toString()), // Convert real to number
        expiry_date: expiryDate,
        created_at: item.created_at,
        updated_at: item.updated_at,
        expiry_status: expiryStatus,
        days_until_expiry: daysDiff
      };
    });

    // Sort by expiry status priority: expired first, then expiring soon, then fresh
    // Within each category, sort by expiry date (earliest first)
    const statusOrder = { expired: 0, expiring_soon: 1, fresh: 2 };
    
    return itemsWithStatus.sort((a, b) => {
      const statusComparison = statusOrder[a.expiry_status] - statusOrder[b.expiry_status];
      if (statusComparison !== 0) {
        return statusComparison;
      }
      // If same status, sort by expiry date (earliest first)
      return a.expiry_date.getTime() - b.expiry_date.getTime();
    });

  } catch (error) {
    console.error('Failed to fetch items with expiry status:', error);
    throw error;
  }
};
