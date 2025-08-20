import { db } from '../db';
import { pantryItemsTable } from '../db/schema';
import { type GetItemsByExpiryInput, type PantryItemWithStatus } from '../schema';
import { gte, lte, and, asc } from 'drizzle-orm';

export const getExpiringSoonItems = async (input: GetItemsByExpiryInput): Promise<PantryItemWithStatus[]> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today

    const endDate = new Date(today);
    endDate.setDate(today.getDate() + input.days_ahead); // days_ahead days from now

    // Query items expiring between today and endDate
    const results = await db.select()
      .from(pantryItemsTable)
      .where(
        and(
          gte(pantryItemsTable.expiry_date, today.toISOString().split('T')[0]), // Today or later
          lte(pantryItemsTable.expiry_date, endDate.toISOString().split('T')[0]) // Within days_ahead
        )
      )
      .orderBy(asc(pantryItemsTable.expiry_date)) // Soonest first
      .execute();

    // Transform results to include expiry status and days calculation
    return results.map(item => {
      const expiryDate = new Date(item.expiry_date);
      const todayTime = new Date();
      todayTime.setHours(0, 0, 0, 0);
      
      // Calculate days until expiry
      const diffTime = expiryDate.getTime() - todayTime.getTime();
      const days_until_expiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return {
        id: item.id,
        name: item.name,
        quantity: item.quantity, // real type - no conversion needed
        expiry_date: new Date(item.expiry_date),
        created_at: item.created_at,
        updated_at: item.updated_at,
        expiry_status: 'expiring_soon' as const,
        days_until_expiry
      };
    });
  } catch (error) {
    console.error('Failed to fetch expiring soon items:', error);
    throw error;
  }
};
