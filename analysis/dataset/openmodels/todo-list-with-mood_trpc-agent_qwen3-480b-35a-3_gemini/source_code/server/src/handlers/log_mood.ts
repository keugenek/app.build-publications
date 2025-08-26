import { db } from '../db';
import { moodsTable } from '../db/schema';
import { type LogMoodInput, type Mood } from '../schema';

export const logMood = async (input: LogMoodInput): Promise<Mood> => {
  try {
    // Insert mood record
    const result = await db.insert(moodsTable)
      .values({
        mood: input.mood,
        description: input.description || null
      })
      .returning()
      .execute();

    const mood = result[0];
    return {
      ...mood,
      created_at: new Date(mood.created_at)
    };
  } catch (error) {
    console.error('Mood logging failed:', error);
    throw error;
  }
};
