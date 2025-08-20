import { db } from '../db';
import { workSessionsTable } from '../db/schema';
import { type GetMetricsByDateInput, type WorkSession } from '../schema';
import { eq, asc } from 'drizzle-orm';

export const getWorkSessionsByDate = async (input: GetMetricsByDateInput): Promise<WorkSession[]> => {
  try {
    // Query work sessions for the specific date, ordered by start_time
    const results = await db.select()
      .from(workSessionsTable)
      .where(eq(workSessionsTable.date, input.date))
      .orderBy(asc(workSessionsTable.start_time))
      .execute();

    // Convert date strings to Date objects to match WorkSession type
    return results.map(session => ({
      ...session,
      date: new Date(session.date)
    }));
  } catch (error) {
    console.error('Failed to get work sessions by date:', error);
    throw error;
  }
};
