import { db } from '../db';
import { pomodoroSessionsTable, pomodoroLogsTable } from '../db/schema';
import { eq, desc } from 'drizzle-orm';

export const getNextPhaseType = async (sessionId: number): Promise<'work' | 'short_break' | 'long_break'> => {
  try {
    // Get session details
    const sessions = await db.select()
      .from(pomodoroSessionsTable)
      .where(eq(pomodoroSessionsTable.id, sessionId))
      .execute();

    if (sessions.length === 0) {
      throw new Error(`Session with id ${sessionId} not found`);
    }

    const session = sessions[0];

    // Get the last completed phase from logs
    const lastLogs = await db.select()
      .from(pomodoroLogsTable)
      .where(eq(pomodoroLogsTable.session_id, sessionId))
      .orderBy(desc(pomodoroLogsTable.started_at))
      .limit(1)
      .execute();

    // If no logs exist, start with work phase
    if (lastLogs.length === 0) {
      return 'work';
    }

    const lastLog = lastLogs[0];
    const lastPhaseType = lastLog.phase_type;

    // Logic: 
    // - After work phase -> determine break type based on completed pomodoros
    // - After any break phase -> always work phase
    if (lastPhaseType === 'work') {
      // Check if it's time for a long break
      // Long break happens after every long_break_interval completed pomodoros
      const shouldBeLongBreak = session.completed_pomodoros > 0 && 
                               session.completed_pomodoros % session.long_break_interval === 0;
      
      return shouldBeLongBreak ? 'long_break' : 'short_break';
    } else {
      // After any break phase, always return to work
      return 'work';
    }
  } catch (error) {
    console.error('Failed to determine next phase type:', error);
    throw error;
  }
};
