import { type WellnessEntry } from '../schema';
import { db } from '../db';
import { wellnessEntriesTable } from '../db/schema';

/** Handler to fetch all wellness entries. */
export async function getWellnessEntries(): Promise<WellnessEntry[]> {
  // Query all wellness entries from the database
  const rows = await db.select().from(wellnessEntriesTable).execute();
  // Convert numeric fields stored as strings back to numbers
  return rows.map(row => ({
    ...row,
    sleep_hours: parseFloat(row.sleep_hours as any),
    wellness_score: parseFloat(row.wellness_score as any)
  })) as WellnessEntry[];
}
