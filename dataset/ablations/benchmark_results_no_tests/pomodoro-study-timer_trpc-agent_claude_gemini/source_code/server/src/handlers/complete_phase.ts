import { db } from '../db';
import { pomodoroSessionsTable, pomodoroLogsTable } from '../db/schema';
import { type CompletePhaseInput, type PomodoroSession } from '../schema';
import { eq, and, isNull } from 'drizzle-orm';

export const completePhase = async (input: CompletePhaseInput): Promise<PomodoroSession> => {
  try {
    // First, get the current session to validate it exists and is active
    const session = await db.select()
      .from(pomodoroSessionsTable)
      .where(eq(pomodoroSessionsTable.id, input.session_id))
      .execute();

    if (session.length === 0) {
      throw new Error(`Session with id ${input.session_id} not found`);
    }

    const currentSession = session[0];
    
    if (!currentSession.is_active) {
      throw new Error(`Session ${input.session_id} is not currently active`);
    }

    if (currentSession.current_phase === 'idle') {
      throw new Error(`Session ${input.session_id} is in idle phase, nothing to complete`);
    }

    // Find the current active log entry (the one without completed_at)
    const activeLog = await db.select()
      .from(pomodoroLogsTable)
      .where(
        and(
          eq(pomodoroLogsTable.session_id, input.session_id),
          isNull(pomodoroLogsTable.completed_at)
        )
      )
      .execute();

    if (activeLog.length === 0) {
      throw new Error(`No active log entry found for session ${input.session_id}`);
    }

    const currentLog = activeLog[0];

    // Update the log entry with completion time and interruption status
    await db.update(pomodoroLogsTable)
      .set({
        completed_at: new Date(),
        was_interrupted: input.was_interrupted
      })
      .where(eq(pomodoroLogsTable.id, currentLog.id))
      .execute();

    // Prepare session updates
    let sessionUpdates: any = {
      is_active: false,
      current_phase: 'idle' as const,
      phase_start_time: null,
      updated_at: new Date()
    };

    // If completing a work phase and not interrupted, increment completed pomodoros
    if (currentLog.phase_type === 'work' && !input.was_interrupted) {
      sessionUpdates.completed_pomodoros = currentSession.completed_pomodoros + 1;
    }

    // Update the session
    const updatedSessions = await db.update(pomodoroSessionsTable)
      .set(sessionUpdates)
      .where(eq(pomodoroSessionsTable.id, input.session_id))
      .returning()
      .execute();

    return updatedSessions[0];
  } catch (error) {
    console.error('Complete phase failed:', error);
    throw error;
  }
};
