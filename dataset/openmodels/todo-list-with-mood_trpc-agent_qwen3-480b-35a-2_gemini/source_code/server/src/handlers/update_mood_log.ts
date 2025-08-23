import { db } from '../db';
import { moodLogsTable } from '../db/schema';
import { type UpdateMoodLogInput, type MoodLog } from '../schema';
import { eq } from 'drizzle-orm';

export const updateMoodLog = async (input: UpdateMoodLogInput): Promise<MoodLog> => {
  try {
    // Build update data object with only provided fields
    const updateData: Partial<typeof moodLogsTable.$inferInsert> = {};
    
    if (input.mood !== undefined) {
      updateData.mood = input.mood;
    }
    
    if (input.note !== undefined) {
      updateData.note = input.note;
    }
    
    // Update mood log record
    const result = await db.update(moodLogsTable)
      .set(updateData)
      .where(eq(moodLogsTable.id, input.id))
      .returning()
      .execute();
    
    // Check if mood log was found and updated
    if (result.length === 0) {
      throw new Error(`Mood log with id ${input.id} not found`);
    }
    
    // Return the updated mood log
    return result[0];
  } catch (error) {
    console.error('Mood log update failed:', error);
    throw error;
  }
};
