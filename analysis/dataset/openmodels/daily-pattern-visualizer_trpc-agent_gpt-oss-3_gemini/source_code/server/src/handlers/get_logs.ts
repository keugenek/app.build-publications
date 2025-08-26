import { type Log } from '../schema';

import { db } from '../db';
import { logsTable } from '../db/schema';

// Handler to fetch all logs from the database and convert numeric fields to numbers.
export async function getLogs(): Promise<Log[]> {
  try {
    const rows = await db.select().from(logsTable).execute();
    // Map database rows to Log type, converting numeric strings and date strings to proper types.
    return rows.map((row) => ({
      id: row.id,
      date: new Date(row.date), // date column is stored as string, coerce to Date
      sleep_duration: parseFloat(row.sleep_duration),
      work_hours: parseFloat(row.work_hours),
      social_time: parseFloat(row.social_time),
      screen_time: parseFloat(row.screen_time),
      emotional_energy: row.emotional_energy,
      created_at: row.created_at
    }));
  } catch (error) {
    console.error('Failed to fetch logs:', error);
    throw error;
  }
}
