import { db } from '../db';
import { timerSessionsTable } from '../db/schema';
import { type CreateTimerSessionInput, type TimerSession } from '../schema';

export const createTimerSession = async (input: CreateTimerSessionInput): Promise<TimerSession> => {
  try {
    // Insert timer session record with current timestamp
    const result = await db.insert(timerSessionsTable)
      .values({
        session_type: input.session_type,
        duration_minutes: input.duration_minutes,
        completed_at: new Date() // Current timestamp when session completed
      })
      .returning()
      .execute();

    // Return the created session
    const session = result[0];
    return {
      ...session
    };
  } catch (error) {
    console.error('Timer session creation failed:', error);
    throw error;
  }
};
