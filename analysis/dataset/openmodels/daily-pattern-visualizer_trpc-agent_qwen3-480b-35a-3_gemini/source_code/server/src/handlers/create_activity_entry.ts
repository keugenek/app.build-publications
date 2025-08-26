import { db } from '../db';
import { activityEntriesTable } from '../db/schema';
import { type CreateActivityEntryInput, type ActivityEntry } from '../schema';

export const createActivityEntry = async (input: CreateActivityEntryInput): Promise<ActivityEntry> => {
  try {
    // Insert activity entry record
    const result = await db.insert(activityEntriesTable)
      .values({
        user_id: input.user_id,
        date: input.date,
        sleep_hours: input.sleep_hours.toString(),
        work_hours: input.work_hours.toString(),
        social_time: input.social_time.toString(),
        screen_time: input.screen_time.toString(),
        emotional_energy: input.emotional_energy
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const activityEntry = result[0];
    return {
      ...activityEntry,
      sleep_hours: parseFloat(activityEntry.sleep_hours),
      work_hours: parseFloat(activityEntry.work_hours),
      social_time: parseFloat(activityEntry.social_time),
      screen_time: parseFloat(activityEntry.screen_time)
    };
  } catch (error) {
    console.error('Activity entry creation failed:', error);
    throw error;
  }
};
