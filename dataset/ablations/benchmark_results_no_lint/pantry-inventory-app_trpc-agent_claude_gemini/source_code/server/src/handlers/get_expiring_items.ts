import { db } from '../db';
import { pantryItemsTable } from '../db/schema';
import { type ExpiringItemsInput, type PantryItem } from '../schema';
import { lte, asc } from 'drizzle-orm';

export const getExpiringItems = async (input: ExpiringItemsInput): Promise<PantryItem[]> => {
  try {
    // Calculate the target date (today + days_ahead)
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + input.days_ahead);

    // Query pantry items that expire within the specified days
    const results = await db.select()
      .from(pantryItemsTable)
      .where(lte(pantryItemsTable.expiration_date, targetDate.toISOString().split('T')[0]))
      .orderBy(asc(pantryItemsTable.expiration_date))
      .execute();

    // Convert numeric fields back to numbers before returning
    return results.map(item => ({
      ...item,
      quantity: parseFloat(item.quantity),
      expiration_date: new Date(item.expiration_date)
    }));
  } catch (error) {
    console.error('Getting expiring items failed:', error);
    throw error;
  }
};
