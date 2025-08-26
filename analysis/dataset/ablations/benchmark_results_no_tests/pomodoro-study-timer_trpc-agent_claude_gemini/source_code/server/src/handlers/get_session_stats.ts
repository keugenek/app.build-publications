import { db } from '../db';
import { pomodoroLogsTable, pomodoroSessionsTable } from '../db/schema';
import { type SessionStats } from '../schema';
import { eq, and, isNotNull } from 'drizzle-orm';

export const getSessionStats = async (sessionId: number): Promise<SessionStats> => {
  try {
    // Verify session exists
    const session = await db.select()
      .from(pomodoroSessionsTable)
      .where(eq(pomodoroSessionsTable.id, sessionId))
      .execute();

    if (session.length === 0) {
      throw new Error(`Session with id ${sessionId} not found`);
    }

    // Get all log entries for this session
    const logs = await db.select()
      .from(pomodoroLogsTable)
      .where(eq(pomodoroLogsTable.session_id, sessionId))
      .execute();

    // Calculate statistics
    let totalCompletedPomodoros = 0;
    let totalWorkTime = 0;
    let totalBreakTime = 0;
    let totalPhases = 0;
    let interruptedPhases = 0;
    let lastActivity: Date | null = null;

    for (const log of logs) {
      totalPhases++;

      // Track interruptions
      if (log.was_interrupted) {
        interruptedPhases++;
      }

      // Count completed work pomodoros (work phases that weren't interrupted)
      if (log.phase_type === 'work' && !log.was_interrupted) {
        totalCompletedPomodoros++;
      }

      // Accumulate time by phase type
      if (log.phase_type === 'work') {
        totalWorkTime += log.duration_minutes;
      } else {
        // Both short_break and long_break count as break time
        totalBreakTime += log.duration_minutes;
      }

      // Track last activity (most recent start time)
      if (lastActivity === null || log.started_at > lastActivity) {
        lastActivity = log.started_at;
      }
    }

    // Calculate completion rate (percentage of non-interrupted phases)
    const completionRate = totalPhases > 0 
      ? ((totalPhases - interruptedPhases) / totalPhases) * 100 
      : 0;

    return {
      session_id: sessionId,
      total_completed_pomodoros: totalCompletedPomodoros,
      total_work_time: totalWorkTime,
      total_break_time: totalBreakTime,
      completion_rate: completionRate,
      last_activity: lastActivity
    };
  } catch (error) {
    console.error('Get session stats failed:', error);
    throw error;
  }
};
