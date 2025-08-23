import { db } from '../db';
import { activityEntriesTable } from '../db/schema';
import { type UpdateActivityEntryInput, type ActivityEntry } from '../schema';
import { eq } from 'drizzle-orm';

export const updateActivityEntry = async (input: UpdateActivityEntryInput): Promise<ActivityEntry> => {
  try {
    // Prepare update data, excluding id and undefined values
    const updateData: any = {};
    
    if (input.user_id !== undefined) updateData.user_id = input.user_id;
    if (input.date !== undefined) updateData.date = input.date;
    if (input.sleep_hours !== undefined) updateData.sleep_hours = input.sleep_hours.toString();
    if (input.work_hours !== undefined) updateData.work_hours = input.work_hours.toString();
    if (input.social_time !== undefined) updateData.social_time = input.social_time.toString();
    if (input.screen_time !== undefined) updateData.screen_time = input.screen_time.toString();
    if (input.emotional_energy !== undefined) updateData.emotional_energy = input.emotional_energy;
    
    // Always update the updated_at timestamp
    updateData.updated_at = new Date();

    // Update the activity entry
    const result = await db.update(activityEntriesTable)
      .set(updateData)
      .where(eq(activityEntriesTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Activity entry with id ${input.id} not found`);
    }

    // Convert numeric fields back to numbers before returning
    const updatedEntry = result[0];
    return {
      ...updatedEntry,
      sleep_hours: parseFloat(updatedEntry.sleep_hours),
      work_hours: parseFloat(updatedEntry.work_hours),
      social_time: parseFloat(updatedEntry.social_time),
      screen_time: parseFloat(updatedEntry.screen_time)
    };
  } catch (error) {
    console.error('Activity entry update failed:', error);
    throw error;
  }
};
