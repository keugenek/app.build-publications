import { db } from '../db';
import { catsTable } from '../db/schema';
import { type Cat } from '../schema';

// Fetch all cats from the database.
export const getCats = async (): Promise<Cat[]> => {
  try {
    const rows = await db.select().from(catsTable).execute();
    // Drizzle returns `created_at` as Date, but ensure it matches schema.
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      owner_name: row.owner_name ?? null,
      created_at: row.created_at,
    }));
  } catch (error) {
    console.error('Failed to fetch cats:', error);
    throw error;
  }
};
