import { db } from '../db';
import { workSessionsTable } from '../db/schema';
import { type StartWorkSessionInput, type WorkSession } from '../schema';
import { isNull } from 'drizzle-orm';

export const startWorkSession = async (input: StartWorkSessionInput): Promise<WorkSession> => {
  try {
    const now = new Date();
    const today = now.toISOString().split('T')[0]; // YYYY-MM-DD format

    // First, end any ongoing work sessions (sessions with null end_time)
    await db.update(workSessionsTable)
      .set({ end_time: now })
      .where(isNull(workSessionsTable.end_time))
      .execute();

    // Create new work session
    const result = await db.insert(workSessionsTable)
      .values({
        date: today,
        start_time: now,
        end_time: null, // Session is ongoing
        is_break: input.is_break
      })
      .returning()
      .execute();

    // Convert date string back to Date object for return type compatibility
    const session = result[0];
    return {
      ...session,
      date: new Date(session.date)
    };
  } catch (error) {
    console.error('Work session start failed:', error);
    throw error;
  }
};
