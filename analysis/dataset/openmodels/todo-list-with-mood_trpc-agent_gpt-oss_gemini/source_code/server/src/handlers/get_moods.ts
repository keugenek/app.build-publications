import { db } from '../db';
import { moodsTable } from '../db/schema';
import { type MoodEntry } from '../schema';

/**
 * Retrieves all mood entries from the database.
 *
 * The function queries the `moods` table and returns the results as an array of
 * {@link MoodEntry}. All timestamp columns are returned as `Date` objects by
 * Drizzle, so no additional conversion is required.
 *
 * Errors are logged and re‑thrown to preserve the original stack trace.
 */
export const getMoods = async (): Promise<MoodEntry[]> => {
  try {
    const rows = await db.select().from(moodsTable).execute();
    // rows already match the MoodEntry type (including Date objects)
    return rows;
  } catch (error) {
    console.error('Failed to retrieve moods:', error);
    throw error;
  }
};
