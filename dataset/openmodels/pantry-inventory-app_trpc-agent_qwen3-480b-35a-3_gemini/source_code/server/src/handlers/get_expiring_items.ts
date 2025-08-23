import { db } from '../db';
import { pantryItemsTable } from '../db/schema';
import { type ExpiringItem } from '../schema';
import { sql } from 'drizzle-orm';

export const getExpiringItems = async (): Promise<ExpiringItem[]> => {
  try {
    // Query pantry items expiring within 7 days
    const results = await db.select({
      id: pantryItemsTable.id,
      name: pantryItemsTable.name,
      expiry_date: pantryItemsTable.expiry_date,
    })
    .from(pantryItemsTable)
    .where(
      // Items that expire within 7 days from today (including today)
      sql`${pantryItemsTable.expiry_date} >= CURRENT_DATE AND ${pantryItemsTable.expiry_date} <= CURRENT_DATE + INTERVAL '7 days'`
    )
    .orderBy(pantryItemsTable.expiry_date)
    .execute();

    // Calculate days until expiry for each item
    return results.map(item => {
      const expiryDate = new Date(item.expiry_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time part for accurate calculation
      
      const timeDiff = expiryDate.getTime() - today.getTime();
      const daysUntilExpiry = Math.ceil(timeDiff / (1000 * 3600 * 24));
      
      return {
        ...item,
        expiry_date: expiryDate,
        days_until_expiry: daysUntilExpiry
      };
    });
  } catch (error) {
    console.error('Failed to fetch expiring items:', error);
    throw error;
  }
};
