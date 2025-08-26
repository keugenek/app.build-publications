import { serial, text, pgTable, timestamp, integer, boolean, pgEnum } from 'drizzle-orm/pg-core';

// Define session type enum
export const sessionTypeEnum = pgEnum('session_type', ['work', 'break']);

// Timer sessions table
export const timerSessionsTable = pgTable('timer_sessions', {
  id: serial('id').primaryKey(),
  session_type: sessionTypeEnum('session_type').notNull(),
  duration_minutes: integer('duration_minutes').notNull(),
  completed_at: timestamp('completed_at').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Timer settings table (single row configuration)
export const timerSettingsTable = pgTable('timer_settings', {
  id: serial('id').primaryKey(),
  work_duration_minutes: integer('work_duration_minutes').notNull().default(25),
  break_duration_minutes: integer('break_duration_minutes').notNull().default(5),
  audio_enabled: boolean('audio_enabled').notNull().default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// TypeScript types for the table schemas
export type TimerSession = typeof timerSessionsTable.$inferSelect;
export type NewTimerSession = typeof timerSessionsTable.$inferInsert;
export type TimerSettings = typeof timerSettingsTable.$inferSelect;
export type NewTimerSettings = typeof timerSettingsTable.$inferInsert;

// Export all tables for proper query building
export const tables = { 
  timerSessions: timerSessionsTable,
  timerSettings: timerSettingsTable 
};
