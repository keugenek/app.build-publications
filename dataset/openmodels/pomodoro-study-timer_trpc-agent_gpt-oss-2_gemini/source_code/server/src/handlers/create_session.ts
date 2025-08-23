import { type CreatePomodoroSessionInput, type PomodoroSession } from '../schema';
import { type NewPomodoroSession } from '../db/schema';

import { db } from '../db';
import { pomodoroSessionsTable } from '../db/schema';

// Handler for creating a pomodoro session.
// Inserts a new record into the database and returns the created session.
export const createPomodoroSession = async (input: CreatePomodoroSessionInput): Promise<PomodoroSession> => {
  const now = new Date();
  // Insert the new session into the database. `ended_at` is omitted to default to NULL.
  const result = await db
    .insert(pomodoroSessionsTable)
    .values({
      type: input.type,
      duration_minutes: input.duration_minutes,
      started_at: now,
      // ended_at is undefined => will be stored as NULL
      completed: false,
    })
    .returning()
    .execute();

  // Drizzle returns an array of inserted rows; return the first one.
  const session = result[0];
  // No numeric conversion needed as all fields are integer/timestamp/boolean.
  return session;
};
