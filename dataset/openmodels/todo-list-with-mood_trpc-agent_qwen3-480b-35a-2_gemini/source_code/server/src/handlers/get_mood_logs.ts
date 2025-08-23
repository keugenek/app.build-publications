import { db } from '../db';
import { moodLogsTable } from '../db/schema';
import { type MoodLog } from '../schema';

export const getMoodLogs = async (): Promise<MoodLog[]> => {
  try {
    const results = await db.select()
      .from(moodLogsTable)
      .orderBy(moodLogsTable.logged_at)
      .execute();

    // Convert date fields and return
    return results.map(log => ({
      ...log,
      logged_at: log.logged_at
    }));
  } catch (error) {
    console.error('Failed to fetch mood logs:', error);
    throw error;
  }
};
