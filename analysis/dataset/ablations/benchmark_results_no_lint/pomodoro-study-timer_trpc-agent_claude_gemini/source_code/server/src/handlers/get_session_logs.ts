import { db } from '../db';
import { timerSessionsTable } from '../db/schema';
import { type GetSessionLogsInput, type SessionLog } from '../schema';
import { sql, and, gte, lte, desc } from 'drizzle-orm';

export async function getSessionLogs(input: GetSessionLogsInput = {}): Promise<SessionLog[]> {
  try {
    // Set default date range to last 30 days if not provided
    const endDate = input.end_date || new Date().toISOString().split('T')[0];
    const startDate = input.start_date || (() => {
      // If end_date is provided but start_date is not, calculate start_date relative to end_date
      const baseDate = input.end_date ? new Date(input.end_date) : new Date();
      baseDate.setDate(baseDate.getDate() - 30);
      return baseDate.toISOString().split('T')[0];
    })();

    // Convert string dates to Date objects for comparison
    const startDateObj = new Date(startDate + 'T00:00:00.000Z');
    const endDateObj = new Date(endDate + 'T23:59:59.999Z');

    // Build base query with aggregations
    const baseQuery = db.select({
      date: sql<string>`DATE(${timerSessionsTable.completed_at})`.as('date'),
      work_sessions_count: sql<number>`COUNT(CASE WHEN ${timerSessionsTable.session_type} = 'work' THEN 1 END)`.as('work_sessions_count'),
      break_sessions_count: sql<number>`COUNT(CASE WHEN ${timerSessionsTable.session_type} = 'break' THEN 1 END)`.as('break_sessions_count'),
      total_work_minutes: sql<number>`COALESCE(SUM(CASE WHEN ${timerSessionsTable.session_type} = 'work' THEN ${timerSessionsTable.duration_minutes} END), 0)`.as('total_work_minutes'),
      total_break_minutes: sql<number>`COALESCE(SUM(CASE WHEN ${timerSessionsTable.session_type} = 'break' THEN ${timerSessionsTable.duration_minutes} END), 0)`.as('total_break_minutes')
    })
    .from(timerSessionsTable);

    // Apply date range filters
    const conditions = [
      gte(timerSessionsTable.completed_at, startDateObj),
      lte(timerSessionsTable.completed_at, endDateObj)
    ];

    const results = await baseQuery
      .where(and(...conditions))
      .groupBy(sql`DATE(${timerSessionsTable.completed_at})`)
      .orderBy(desc(sql`DATE(${timerSessionsTable.completed_at})`))
      .execute();

    // Convert the results to the expected SessionLog format
    return results.map(result => ({
      date: result.date,
      work_sessions_count: Number(result.work_sessions_count),
      break_sessions_count: Number(result.break_sessions_count),
      total_work_minutes: Number(result.total_work_minutes),
      total_break_minutes: Number(result.total_break_minutes)
    }));

  } catch (error) {
    console.error('Failed to fetch session logs:', error);
    throw error;
  }
}
