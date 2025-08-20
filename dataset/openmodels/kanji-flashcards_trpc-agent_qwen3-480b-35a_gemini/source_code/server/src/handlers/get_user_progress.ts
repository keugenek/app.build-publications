import { db } from '../db';
import { userProgressTable } from '../db/schema';
import { type UserProgress } from '../schema';
import { eq } from 'drizzle-orm';

export const getUserProgress = async (userId: string): Promise<UserProgress[]> => {
  try {
    // Fetch user progress records for the given user ID
    const results = await db.select()
      .from(userProgressTable)
      .where(eq(userProgressTable.userId, userId))
      .execute();

    // Convert numeric fields back to numbers before returning
    return results.map(progress => ({
      ...progress,
      masteredKanjiCount: progress.masteredKanjiCount,
      totalKanjiCount: progress.totalKanjiCount
    }));
  } catch (error) {
    console.error('Failed to fetch user progress:', error);
    throw error;
  }
};
