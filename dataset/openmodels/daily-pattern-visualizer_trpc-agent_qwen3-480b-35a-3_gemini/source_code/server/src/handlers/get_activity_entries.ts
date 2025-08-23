import { db } from '../db';
import { activityEntriesTable } from '../db/schema';
import { type ActivityEntry } from '../schema';
import { eq } from 'drizzle-orm';

export const getActivityEntries = async (userId: string): Promise<ActivityEntry[]> => {
  try {
    // Query activity entries for the specified user
    const results = await db.select()
      .from(activityEntriesTable)
      .where(eq(activityEntriesTable.user_id, userId))
      .execute();

    // Convert numeric fields back to numbers before returning
    return results.map(entry => ({
      ...entry,
      sleep_hours: parseFloat(entry.sleep_hours),
      work_hours: parseFloat(entry.work_hours),
      social_time: parseFloat(entry.social_time),
      screen_time: parseFloat(entry.screen_time),
      date: new Date(entry.date),
      created_at: new Date(entry.created_at),
      updated_at: new Date(entry.updated_at)
    }));
  } catch (error) {
    console.error('Failed to fetch activity entries:', error);
    throw error;
  }
};
