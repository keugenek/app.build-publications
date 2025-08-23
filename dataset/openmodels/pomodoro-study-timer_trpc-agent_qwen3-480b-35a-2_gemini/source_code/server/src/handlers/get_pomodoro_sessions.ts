import { type PomodoroSession } from '../schema';
import { db } from '../db';
import { pomodoroSessionsTable } from '../db/schema';
import { desc } from 'drizzle-orm';

export const getPomodoroSessions = async (): Promise<PomodoroSession[]> => {
  // Fetch all Pomodoro sessions from the database, ordered by start time (newest first)
  const sessions = await db.select().from(pomodoroSessionsTable).orderBy(desc(pomodoroSessionsTable.startTime));
  
  return sessions as PomodoroSession[];
};
