import { db } from '../db';
import { choresTable } from '../db/schema';
import { type Chore } from '../schema';
import { desc } from 'drizzle-orm';

export async function getChores(): Promise<Chore[]> {
  try {
    // Fetch all chores from the database, ordered by creation date (newest first)
    const results = await db.select()
      .from(choresTable)
      .orderBy(desc(choresTable.created_at))
      .execute();

    // Return the results - no numeric conversions needed for this table
    return results;
  } catch (error) {
    console.error('Failed to fetch chores:', error);
    throw error;
  }
}
