import { type Chore } from '../schema';
import { db } from '../db';
import { choresTable } from '../db/schema';

/**
 * Stub handler for fetching all chores.
 * Real implementation would query the database.
 */
export const getChores = async (): Promise<Chore[]> => {
  try {
    const rows = await db.select().from(choresTable).execute();
    return rows;
  } catch (error) {
    console.error('Failed to fetch chores:', error);
    throw error;
  }
};
