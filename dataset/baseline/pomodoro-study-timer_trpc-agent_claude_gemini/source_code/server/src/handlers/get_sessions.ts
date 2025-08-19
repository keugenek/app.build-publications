import { db } from '../db';
import { sessionsTable } from '../db/schema';
import { type Session } from '../schema';
import { desc } from 'drizzle-orm';

export const getSessions = async (): Promise<Session[]> => {
  try {
    // Query all sessions ordered by completion time (most recent first)
    const results = await db.select()
      .from(sessionsTable)
      .orderBy(desc(sessionsTable.completed_at))
      .execute();

    // Return results with proper type casting for the session type
    // The type field comes from database as string but needs to be cast to the union type
    return results.map(session => ({
      ...session,
      type: session.type as 'work' | 'break'
    }));
  } catch (error) {
    console.error('Failed to fetch sessions:', error);
    throw error;
  }
};
