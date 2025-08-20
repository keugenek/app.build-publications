import { db } from '../db';
import { choresTable } from '../db/schema';
import { type Chore } from '../schema';
import { desc } from 'drizzle-orm';

export async function getChores(): Promise<Chore[]> {
  try {
    // Fetch all chores ordered by assigned_date desc, then created_at desc
    const results = await db.select()
      .from(choresTable)
      .orderBy(desc(choresTable.assigned_date), desc(choresTable.created_at))
      .execute();

    // Return results - no numeric conversions needed for this schema
    return results;
  } catch (error) {
    console.error('Get chores failed:', error);
    throw error;
  }
}
