import { db } from '../db';
import { moodsTable } from '../db/schema';
import { type Mood } from '../schema';

export const getMoods = async (): Promise<Mood[]> => {
  try {
    const results = await db.select()
      .from(moodsTable)
      .orderBy(moodsTable.created_at)
      .execute();

    // Convert numeric fields back to numbers before returning
    return results.map(mood => ({
      ...mood,
      mood: mood.mood // mood is already a number, no conversion needed
    }));
  } catch (error) {
    console.error('Failed to fetch moods:', error);
    throw error;
  }
};
