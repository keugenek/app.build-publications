import { db } from '../db';
import { sessionsTable } from '../db/schema';
import { type CreateSessionInput, type Session } from '../schema';

export const createSession = async (input: CreateSessionInput): Promise<Session> => {
  try {
    // Insert session record
    const result = await db.insert(sessionsTable)
      .values({
        type: input.type,
        duration: input.duration
      })
      .returning()
      .execute();

    const session = result[0];
    return {
      id: session.id,
      type: session.type as 'work' | 'break', // Type assertion for the enum
      duration: session.duration,
      completed_at: session.completed_at // Already a Date object from timestamp column
    };
  } catch (error) {
    console.error('Session creation failed:', error);
    throw error;
  }
};
