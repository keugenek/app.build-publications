import { db } from '../db';
import { activityEntriesTable } from '../db/schema';
import { type ActivityEntry } from '../schema';
import { eq } from 'drizzle-orm';

export const getActivityEntry = async (id: number): Promise<ActivityEntry | null> => {
  try {
    const result = await db.select()
      .from(activityEntriesTable)
      .where(eq(activityEntriesTable.id, id))
      .execute();

    if (result.length === 0) {
      return null;
    }

    const entry = result[0];
    return {
      ...entry,
      date: new Date(entry.date),
      sleep_hours: parseFloat(entry.sleep_hours),
      work_hours: parseFloat(entry.work_hours),
      social_time: parseFloat(entry.social_time),
      screen_time: parseFloat(entry.screen_time),
      emotional_energy: entry.emotional_energy,
      created_at: new Date(entry.created_at),
      updated_at: new Date(entry.updated_at)
    };
  } catch (error) {
    console.error('Failed to fetch activity entry:', error);
    throw error;
  }
};
