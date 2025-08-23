import { db } from '../db';
import { moodLogsTable } from '../db/schema';
import { type CreateMoodLogInput, type MoodLog } from '../schema';

export const createMoodLog = async (input: CreateMoodLogInput): Promise<MoodLog> => {
  try {
    const result = await db.insert(moodLogsTable)
      .values({
        mood: input.mood,
        note: input.note
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Mood log creation failed:', error);
    throw error;
  }
};
