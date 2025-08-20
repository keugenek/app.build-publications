import { db } from '../db';
import { pomodoroSessionsTable } from '../db/schema';
import { type CreatePomodoroSessionInput, type PomodoroSession } from '../schema';

export const createPomodoroSession = async (input: CreatePomodoroSessionInput): Promise<PomodoroSession> => {
  try {
    // Insert pomodoro session record
    const result = await db.insert(pomodoroSessionsTable)
      .values({
        work_duration: input.work_duration,
        short_break_duration: input.short_break_duration,
        long_break_duration: input.long_break_duration,
        long_break_interval: input.long_break_interval,
        completed_pomodoros: 0, // Always start with 0 completed pomodoros
        is_active: false, // New sessions are inactive by default
        current_phase: 'idle', // New sessions start in idle phase
        phase_start_time: null // No active phase initially
      })
      .returning()
      .execute();

    // Return the created session
    const session = result[0];
    return {
      ...session,
      // Convert timestamps to Date objects for schema compliance
      created_at: session.created_at!,
      updated_at: session.updated_at!
    };
  } catch (error) {
    console.error('Pomodoro session creation failed:', error);
    throw error;
  }
};
