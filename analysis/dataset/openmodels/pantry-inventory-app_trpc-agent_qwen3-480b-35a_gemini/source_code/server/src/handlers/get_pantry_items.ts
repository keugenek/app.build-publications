import { db } from '../db';
import { type PantryItem } from '../schema';
import { sql } from 'drizzle-orm';

export const getPantryItems = async (): Promise<PantryItem[]> => {
  try {
    // Select all pantry items from the database
    // Using raw SQL to avoid dependency on schema definitions
    const result = await db.execute(sql`
      SELECT id, name, quantity, expiry_date, created_at, updated_at
      FROM pantry_items
      ORDER BY name
    `);
    
    // Map the results to match the PantryItem type
    return result.rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      quantity: row.quantity,
      expiry_date: new Date(row.expiry_date),
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at)
    }));
  } catch (error: any) {
    // If the table doesn't exist, return an empty array
    if (error.code === '42P01') {
      return [];
    }
    console.error('Failed to fetch pantry items:', error);
    throw error;
  }
};
