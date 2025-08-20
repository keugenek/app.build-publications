import { db } from '../db';
import { studySessionsTable } from '../db/schema';
import { type LogSessionInput, type StudySession } from '../schema';
import { eq } from 'drizzle-orm';

export const logStudySession = async (input: LogSessionInput): Promise<StudySession> => {
  try {
    // First, check if a record exists for this date
    const existingSessions = await db.select()
      .from(studySessionsTable)
      .where(eq(studySessionsTable.date, input.date))
      .execute();

    if (existingSessions.length > 0) {
      // Update existing record by incrementing completed_sessions
      const existingSession = existingSessions[0];
      const result = await db.update(studySessionsTable)
        .set({
          completed_sessions: existingSession.completed_sessions + 1,
          updated_at: new Date()
        })
        .where(eq(studySessionsTable.id, existingSession.id))
        .returning()
        .execute();

      return result[0];
    } else {
      // Insert new record
      const result = await db.insert(studySessionsTable)
        .values({
          date: input.date,
          completed_sessions: 1
        })
        .returning()
        .execute();

      return result[0];
    }
  } catch (error) {
    console.error('Failed to log study session:', error);
    throw error;
  }
};
