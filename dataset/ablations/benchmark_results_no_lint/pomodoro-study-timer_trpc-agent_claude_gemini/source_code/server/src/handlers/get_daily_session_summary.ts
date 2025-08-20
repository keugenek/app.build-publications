import { db } from '../db';
import { timerSessionsTable } from '../db/schema';
import { type SessionLog } from '../schema';
import { sql, and, gte, lt } from 'drizzle-orm';

export async function getDailySessionSummary(date?: string): Promise<SessionLog> {
  try {
    const targetDate = date ?? new Date().toISOString().split('T')[0]; // Default to today in YYYY-MM-DD format
    
    // Create date boundaries for the target date
    const startOfDay = new Date(`${targetDate}T00:00:00.000Z`);
    const endOfDay = new Date(`${targetDate}T23:59:59.999Z`);

    // Query all sessions for the target date
    const sessions = await db.select()
      .from(timerSessionsTable)
      .where(
        and(
          gte(timerSessionsTable.completed_at, startOfDay),
          lt(timerSessionsTable.completed_at, endOfDay)
        )
      )
      .execute();

    // Aggregate the data
    let work_sessions_count = 0;
    let break_sessions_count = 0;
    let total_work_minutes = 0;
    let total_break_minutes = 0;

    sessions.forEach(session => {
      if (session.session_type === 'work') {
        work_sessions_count++;
        total_work_minutes += session.duration_minutes;
      } else if (session.session_type === 'break') {
        break_sessions_count++;
        total_break_minutes += session.duration_minutes;
      }
    });

    return {
      date: targetDate,
      work_sessions_count,
      break_sessions_count,
      total_work_minutes,
      total_break_minutes
    };
  } catch (error) {
    console.error('Daily session summary failed:', error);
    throw error;
  }
}
