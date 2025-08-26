import { db } from '../db';
import { workSessionsTable } from '../db/schema';
import { type WorkSession } from '../schema';
import { isNull, desc } from 'drizzle-orm';

export const getActiveWorkSession = async (): Promise<WorkSession | null> => {
  try {
    // Query for the most recent session where end_time is null (active session)
    const result = await db.select()
      .from(workSessionsTable)
      .where(isNull(workSessionsTable.end_time))
      .orderBy(desc(workSessionsTable.start_time))
      .limit(1)
      .execute();

    // Return the active session or null if none exists
    if (result.length === 0) {
      return null;
    }

    const session = result[0];
    return {
      ...session,
      date: new Date(session.date) // Convert date string to Date object
    };
  } catch (error) {
    console.error('Failed to get active work session:', error);
    throw error;
  }
};
