import { serial, integer, pgTable, timestamp, date } from 'drizzle-orm/pg-core';

// Timer settings table - stores user's preferred work/break durations
export const timerSettingsTable = pgTable('timer_settings', {
  id: serial('id').primaryKey(),
  work_duration: integer('work_duration').notNull().default(25), // default 25 minutes
  break_duration: integer('break_duration').notNull().default(5), // default 5 minutes
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Study sessions table - tracks completed sessions per day
export const studySessionsTable = pgTable('study_sessions', {
  id: serial('id').primaryKey(),
  date: date('date').notNull(), // YYYY-MM-DD format for daily tracking
  completed_sessions: integer('completed_sessions').notNull().default(0), // number of completed work sessions
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// TypeScript types for the table schemas
export type TimerSettings = typeof timerSettingsTable.$inferSelect;
export type NewTimerSettings = typeof timerSettingsTable.$inferInsert;
export type StudySession = typeof studySessionsTable.$inferSelect;
export type NewStudySession = typeof studySessionsTable.$inferInsert;

// Export all tables for proper query building
export const tables = { 
  timerSettings: timerSettingsTable,
  studySessions: studySessionsTable
};
