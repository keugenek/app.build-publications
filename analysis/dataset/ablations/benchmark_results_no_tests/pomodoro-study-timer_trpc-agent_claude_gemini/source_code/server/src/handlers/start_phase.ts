import { db } from '../db';
import { pomodoroSessionsTable, pomodoroLogsTable } from '../db/schema';
import { type StartPhaseInput, type PomodoroSession } from '../schema';
import { eq } from 'drizzle-orm';

export const startPhase = async (input: StartPhaseInput): Promise<PomodoroSession> => {
  try {
    const now = new Date();

    // First verify the session exists
    const existingSession = await db.select()
      .from(pomodoroSessionsTable)
      .where(eq(pomodoroSessionsTable.id, input.session_id))
      .execute();

    if (existingSession.length === 0) {
      throw new Error(`Session with id ${input.session_id} not found`);
    }

    const session = existingSession[0];

    // Get the duration for the phase being started
    let durationMinutes: number;
    switch (input.phase_type) {
      case 'work':
        durationMinutes = session.work_duration;
        break;
      case 'short_break':
        durationMinutes = session.short_break_duration;
        break;
      case 'long_break':
        durationMinutes = session.long_break_duration;
        break;
    }

    // Update the session with new phase info
    const updatedSession = await db.update(pomodoroSessionsTable)
      .set({
        current_phase: input.phase_type,
        phase_start_time: now,
        is_active: true,
        updated_at: now
      })
      .where(eq(pomodoroSessionsTable.id, input.session_id))
      .returning()
      .execute();

    // Create a new log entry for this phase
    await db.insert(pomodoroLogsTable)
      .values({
        session_id: input.session_id,
        phase_type: input.phase_type,
        duration_minutes: durationMinutes,
        started_at: now,
        completed_at: null, // Will be set when phase is completed
        was_interrupted: false // Will be updated if phase is interrupted
      })
      .execute();

    return updatedSession[0];
  } catch (error) {
    console.error('Phase start failed:', error);
    throw error;
  }
};
