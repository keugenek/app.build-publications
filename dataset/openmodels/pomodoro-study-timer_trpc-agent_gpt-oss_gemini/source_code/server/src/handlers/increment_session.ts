import { type IncrementSessionInput } from '../schema';
import { db } from '../db';
import { pomodoroLogTable } from '../db/schema';
import { eq } from 'drizzle-orm';

/**
 * Handler to increment the session count for a given date.
 * Performs an upsert on the `pomodoro_log` table: if a record for the
 * provided date exists, its `sessions_completed` is incremented; otherwise
 * a new row is created with `sessions_completed` set to 1.
 *
 * The `date` field is stored as a DATE column in the database, so the
 * handler expects the value in `YYYY-MM-DD` format. When no date is supplied
 * the current date is used.
 */
export const incrementSession = async (input: IncrementSessionInput): Promise<void> => {
  const { date } = input;
  // Default to today in YYYY-MM-DD format if no date provided
  const sessionDate = date ?? new Date().toISOString().split('T')[0];

  // Check for an existing log entry for the date
  const existing = await db
    .select()
    .from(pomodoroLogTable)
    .where(eq(pomodoroLogTable.date, sessionDate))
    .limit(1)
    .execute();

  if (existing.length > 0) {
    // Increment the existing count
    const current = existing[0];
    await db
      .update(pomodoroLogTable)
      .set({ sessions_completed: current.sessions_completed + 1 })
      .where(eq(pomodoroLogTable.date, sessionDate))
      .execute();
  } else {
    // Insert a new log entry
    await db
      .insert(pomodoroLogTable)
      .values({ date: sessionDate, sessions_completed: 1 })
      .execute();
  }
};
