import { pgTable, serial, integer, timestamp, date } from 'drizzle-orm/pg-core';

// Pomodoro settings table (single row configuration)
export const pomodoroSettingsTable = pgTable('pomodoro_settings', {
  id: serial('id').primaryKey(),
  work_minutes: integer('work_minutes').notNull().default(25),
  break_minutes: integer('break_minutes').notNull().default(5),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Pomodoro daily log table
export const pomodoroLogTable = pgTable('pomodoro_log', {
  id: serial('id').primaryKey(),
  date: date('date').notNull(), // Stored as DATE type (YYYY-MM-DD)
  sessions_completed: integer('sessions_completed').notNull().default(0),
});

// Export types for SELECT and INSERT operations
export type PomodoroSettings = typeof pomodoroSettingsTable.$inferSelect;
export type NewPomodoroSettings = typeof pomodoroSettingsTable.$inferInsert;

export type PomodoroLog = typeof pomodoroLogTable.$inferSelect;
export type NewPomodoroLog = typeof pomodoroLogTable.$inferInsert;

// Export tables collection for drizzle relations
export const tables = {
  pomodoroSettings: pomodoroSettingsTable,
  pomodoroLog: pomodoroLogTable,
};
