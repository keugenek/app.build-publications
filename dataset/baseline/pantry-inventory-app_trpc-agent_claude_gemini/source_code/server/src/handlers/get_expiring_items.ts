import { db } from '../db';
import { pantryItemsTable } from '../db/schema';
import { type ExpiringItemsRequest, type PantryItem } from '../schema';
import { lte, asc } from 'drizzle-orm';

export async function getExpiringItems(input: ExpiringItemsRequest): Promise<PantryItem[]> {
  try {
    // Calculate the cutoff date based on days_ahead
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() + input.days_ahead);
    
    // Format date to YYYY-MM-DD string for date column comparison
    const cutoffDateString = cutoffDate.toISOString().split('T')[0];

    // Query pantry items expiring within the specified timeframe
    const results = await db.select()
      .from(pantryItemsTable)
      .where(lte(pantryItemsTable.expiry_date, cutoffDateString))
      .orderBy(asc(pantryItemsTable.expiry_date)) // Order by expiry date (soonest first)
      .execute();

    // Convert numeric and date fields back to proper types before returning
    return results.map(item => ({
      ...item,
      quantity: parseFloat(item.quantity), // Convert string back to number
      expiry_date: new Date(item.expiry_date) // Convert string back to Date
    }));
  } catch (error) {
    console.error('Failed to fetch expiring items:', error);
    throw error;
  }
}
