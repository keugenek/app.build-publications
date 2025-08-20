import { db } from '../db';
import { studySessionsTable } from '../db/schema';
import { type StudySession } from '../schema';
import { eq } from 'drizzle-orm';

export const getDailyStats = async (date: string): Promise<StudySession | null> => {
  try {
    // Query for study session record for the specific date
    const results = await db.select()
      .from(studySessionsTable)
      .where(eq(studySessionsTable.date, date))
      .execute();

    // Return null if no session found for the date
    if (results.length === 0) {
      return null;
    }

    // Return the first (and should be only) record for the date
    return results[0];
  } catch (error) {
    console.error('Failed to get daily stats:', error);
    throw error;
  }
};
