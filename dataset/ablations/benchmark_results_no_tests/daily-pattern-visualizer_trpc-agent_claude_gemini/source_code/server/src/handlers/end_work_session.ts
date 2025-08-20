import { db } from '../db';
import { workSessionsTable } from '../db/schema';
import { type EndWorkSessionInput, type WorkSession } from '../schema';
import { eq, isNull, and } from 'drizzle-orm';

export const endWorkSession = async (input: EndWorkSessionInput): Promise<WorkSession> => {
  try {
    // First, verify that the session exists and is ongoing (end_time is null)
    const existingSessions = await db.select()
      .from(workSessionsTable)
      .where(
        and(
          eq(workSessionsTable.id, input.id),
          isNull(workSessionsTable.end_time)
        )
      )
      .execute();

    if (existingSessions.length === 0) {
      throw new Error(`Work session with id ${input.id} not found or already ended`);
    }

    // Update the session with current timestamp as end_time
    const now = new Date();
    const result = await db.update(workSessionsTable)
      .set({
        end_time: now
      })
      .where(eq(workSessionsTable.id, input.id))
      .returning()
      .execute();

    const updatedSession = result[0];
    return {
      ...updatedSession,
      date: new Date(updatedSession.date as string),
      start_time: updatedSession.start_time as Date,
      end_time: updatedSession.end_time as Date,
      created_at: updatedSession.created_at as Date
    };
  } catch (error) {
    console.error('End work session failed:', error);
    throw error;
  }
};
