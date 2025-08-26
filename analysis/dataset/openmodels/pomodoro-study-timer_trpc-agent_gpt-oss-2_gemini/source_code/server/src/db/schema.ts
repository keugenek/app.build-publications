import { pgTable, serial, integer, timestamp, boolean as pgBoolean, pgEnum } from 'drizzle-orm/pg-core';

// Enum for pomodoro session type
export const pomodoroTypeEnum = pgEnum('pomodoro_type', ['work', 'break']);

// Table definition for pomodoro sessions
export const pomodoroSessionsTable = pgTable('pomodoro_sessions', {
  id: serial('id').primaryKey(),
  type: pomodoroTypeEnum('type').notNull(),
  duration_minutes: integer('duration_minutes').notNull(),
  started_at: timestamp('started_at').notNull(),
  ended_at: timestamp('ended_at'), // nullable by default
  completed: pgBoolean('completed').notNull().default(false),
});

// Types inferred from the table
export type PomodoroSession = typeof pomodoroSessionsTable.$inferSelect;
export type NewPomodoroSession = typeof pomodoroSessionsTable.$inferInsert;

// Export all tables for relation queries
export const tables = {
  pomodoroSessions: pomodoroSessionsTable,
};
