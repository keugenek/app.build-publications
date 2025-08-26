import { db } from '../db';
import { type PantryItem } from '../schema';
import { asc, sql } from 'drizzle-orm';

export const getExpiringItems = async (): Promise<PantryItem[]> => {
  try {
    // Get current date and date 7 days from now
    const today = new Date().toISOString().split('T')[0];
    const oneWeekFromNow = new Date();
    oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);
    const oneWeekFromNowStr = oneWeekFromNow.toISOString().split('T')[0];

    // Query pantry items that are expiring within the next 7 days
    const results = await db.execute(sql`
      SELECT * FROM pantry_items 
      WHERE expiry_date >= ${today}::date 
      AND expiry_date <= ${oneWeekFromNowStr}::date
      ORDER BY expiry_date ASC
    `);

    // Convert date strings back to Date objects and return
    return results.rows.map(item => ({
      id: Number(item['id']),
      name: String(item['name']),
      quantity: Number(item['quantity']),
      expiry_date: new Date(String(item['expiry_date'])),
      created_at: new Date(String(item['created_at'])),
      updated_at: new Date(String(item['updated_at']))
    }));
  } catch (error) {
    console.error('Failed to fetch expiring items:', error);
    throw error;
  }
};
