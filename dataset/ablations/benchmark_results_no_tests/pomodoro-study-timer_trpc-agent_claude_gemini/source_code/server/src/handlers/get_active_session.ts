import { db } from '../db';
import { pomodoroSessionsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type PomodoroSession } from '../schema';

export const getActiveSession = async (): Promise<PomodoroSession | null> => {
  try {
    // Query for active session (is_active = true)
    const results = await db.select()
      .from(pomodoroSessionsTable)
      .where(eq(pomodoroSessionsTable.is_active, true))
      .execute();

    // Return the first active session or null if none found
    if (results.length === 0) {
      return null;
    }

    return results[0];
  } catch (error) {
    console.error('Failed to get active session:', error);
    throw error;
  }
};
