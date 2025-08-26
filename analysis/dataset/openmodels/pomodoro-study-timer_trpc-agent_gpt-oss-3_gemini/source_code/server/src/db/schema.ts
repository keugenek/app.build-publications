import { serial, integer, pgTable, timestamp } from 'drizzle-orm/pg-core';

// ---------------------------------------------------------------------------
// Pomodoro Settings Table
// ---------------------------------------------------------------------------
export const pomodoroSettingsTable = pgTable('pomodoro_settings', {
  id: serial('id').primaryKey(),
  work_interval: integer('work_interval')
    .notNull()
    .default(25), // default 25 minutes
  break_interval: integer('break_interval')
    .notNull()
    .default(5), // default 5 minutes
});

// TypeScript types for settings
export type PomodoroSettings = typeof pomodoroSettingsTable.$inferSelect;
export type NewPomodoroSettings = typeof pomodoroSettingsTable.$inferInsert;

// ---------------------------------------------------------------------------
// Pomodoro Log Table
// ---------------------------------------------------------------------------
export const pomodoroLogTable = pgTable('pomodoro_logs', {
  id: serial('id').primaryKey(),
  started_at: timestamp('started_at')
    .defaultNow()
    .notNull(),
  work_duration: integer('work_duration').notNull(), // minutes
  break_duration: integer('break_duration').notNull(), // minutes
});

export type PomodoroLog = typeof pomodoroLogTable.$inferSelect;
export type NewPomodoroLog = typeof pomodoroLogTable.$inferInsert;

// Export all tables for relation queries
export const tables = {
  pomodoroSettings: pomodoroSettingsTable,
  pomodoroLogs: pomodoroLogTable,
};
