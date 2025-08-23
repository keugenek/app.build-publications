import { type PomodoroSession } from '../schema';

import { db } from '../db';
import { pomodoroSessionsTable } from '../db/schema';

// Handler to fetch all pomodoro sessions from the database.
// Returns an array of PomodoroSession objects as defined in the Zod schema.
export const getPomodoroSessions = async (): Promise<PomodoroSession[]> => {
  try {
    // Build the base query to select all columns from pomodoro_sessions table.
    let query = db.select().from(pomodoroSessionsTable);
    // Execute the query and return the results directly.
    const sessions = await query.execute();
    // The query returns rows matching the PomodoroSession type, so we can return them as is.
    return sessions;
  } catch (error) {
    console.error('Failed to fetch pomodoro sessions:', error);
    throw error;
  }
};
