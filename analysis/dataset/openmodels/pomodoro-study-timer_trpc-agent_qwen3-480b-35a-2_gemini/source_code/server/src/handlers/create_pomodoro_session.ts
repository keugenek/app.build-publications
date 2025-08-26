import { type CreatePomodoroSessionInput, type PomodoroSession } from '../schema';
import { db } from '../db';
import { pomodoroSessionsTable } from '../db/schema';

export const createPomodoroSession = async (input: CreatePomodoroSessionInput): Promise<PomodoroSession> => {
  try {
    // Create a new Pomodoro session in the database
    const [session] = await db.insert(pomodoroSessionsTable).values({
      startTime: input.startTime,
      endTime: input.endTime,
      isWorkSession: input.isWorkSession,
    }).returning();
    
    return session as PomodoroSession;
  } catch (error) {
    console.error('Pomodoro session creation failed:', error);
    throw error;
  }
};
