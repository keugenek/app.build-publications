import { integer, pgTable, serial, timestamp } from 'drizzle-orm/pg-core';

export const pomodoroSettingsTable = pgTable('pomodoro_settings', {
  id: serial('id').primaryKey(),
  workDuration: integer('work_duration').notNull(), // in seconds
  shortBreakDuration: integer('short_break_duration').notNull(), // in seconds
  longBreakDuration: integer('long_break_duration').notNull(), // in seconds
  longBreakInterval: integer('long_break_interval').notNull(), // after how many pomodoros
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

export const pomodoroSessionsTable = pgTable('pomodoro_sessions', {
  id: serial('id').primaryKey(),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time').notNull(),
  isWorkSession: integer('is_work_session').notNull(), // 1 for work, 0 for break
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// TypeScript types for the table schemas
export type PomodoroSettings = typeof pomodoroSettingsTable.$inferSelect;
export type NewPomodoroSettings = typeof pomodoroSettingsTable.$inferInsert;

export type PomodoroSession = typeof pomodoroSessionsTable.$inferSelect;
export type NewPomodoroSession = typeof pomodoroSessionsTable.$inferInsert;

// Export all tables for relation queries
export const tables = { 
  pomodoroSettings: pomodoroSettingsTable, 
  pomodoroSessions: pomodoroSessionsTable 
};
