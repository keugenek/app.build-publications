import { eq } from 'drizzle-orm';
import { db } from '../db';
import { logsTable } from '../db/schema';
import { type UpdateLogInput, type Log } from '../schema';

/**
 * Updates an existing log entry in the database.
 *
 * Numeric columns (`numeric` in PostgreSQL) are stored as strings by Drizzle,
 * so we convert numbers to strings on write and back to numbers on read.
 */
export async function updateLog(input: UpdateLogInput): Promise<Log> {
  try {
    // Build an object of fields to update (only those that are provided)
    const updates: Record<string, any> = {};

    if (input.date !== undefined) {
      // Convert Date to string in YYYY-MM-DD format for Postgres date column
      updates['date'] = input.date.toISOString().slice(0, 10);
    }
    if (input.sleep_duration !== undefined) {
      updates['sleep_duration'] = input.sleep_duration.toString();
    }
    if (input.work_hours !== undefined) {
      updates['work_hours'] = input.work_hours.toString();
    }
    if (input.social_time !== undefined) {
      updates['social_time'] = input.social_time.toString();
    }
    if (input.screen_time !== undefined) {
      updates['screen_time'] = input.screen_time.toString();
    }
    if (input.emotional_energy !== undefined) {
      updates['emotional_energy'] = input.emotional_energy;
    }

    let resultRows;
    if (Object.keys(updates).length === 0) {
      // Nothing to update – just fetch the existing row
      resultRows = await db
        .select()
        .from(logsTable)
        .where(eq(logsTable.id, input.id))
        .execute();
    } else {
      // Perform the update and return the updated row
      resultRows = await db
        .update(logsTable)
        .set(updates as any)
        .where(eq(logsTable.id, input.id))
        .returning()
        .execute();
    }

    const raw = resultRows[0];
    if (!raw) {
      throw new Error(`Log with id ${input.id} not found`);
    }

    // Convert numeric strings back to numbers for the return type
    const log: Log = {
      id: raw.id,
      date: new Date(raw.date as any),
      sleep_duration: parseFloat(raw.sleep_duration as any),
      work_hours: parseFloat(raw.work_hours as any),
      social_time: parseFloat(raw.social_time as any),
      screen_time: parseFloat(raw.screen_time as any),
      emotional_energy: raw.emotional_energy,
      created_at: raw.created_at
    };

    return log;
  } catch (error) {
    console.error('Failed to update log:', error);
    throw error;
  }
}
