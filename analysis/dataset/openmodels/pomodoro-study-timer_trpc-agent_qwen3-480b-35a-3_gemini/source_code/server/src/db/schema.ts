import { pgTable, serial, text, integer, boolean, timestamp, uuid } from 'drizzle-orm/pg-core';

export const timerSettingsTable = pgTable('timer_settings', {
  id: serial('id').primaryKey(),
  workDuration: integer('work_duration').notNull(), // in milliseconds
  breakDuration: integer('break_duration').notNull(), // in milliseconds
});

export const pomodoroSessionsTable = pgTable('pomodoro_sessions', {
  id: uuid('id').primaryKey().notNull(),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time'),
  isWorkSession: boolean('is_work_session').notNull(),
  completed: boolean('completed').notNull().default(false),
});

export const pomodoroLogTable = pgTable('pomodoro_log', {
  id: serial('id').primaryKey(),
  date: text('date').notNull(), // YYYY-MM-DD
  workSessionsCompleted: integer('work_sessions_completed').notNull().default(0),
  breakSessionsCompleted: integer('break_sessions_completed').notNull().default(0),
});

// TypeScript types
export type TimerSettings = typeof timerSettingsTable.$inferSelect;
export type NewTimerSettings = typeof timerSettingsTable.$inferInsert;

export type PomodoroSession = typeof pomodoroSessionsTable.$inferSelect;
export type NewPomodoroSession = typeof pomodoroSessionsTable.$inferInsert;

export type PomodoroLog = typeof pomodoroLogTable.$inferSelect;
export type NewPomodoroLog = typeof pomodoroLogTable.$inferInsert;

// Export tables for relation queries
export const tables = { 
  timerSettings: timerSettingsTable,
  pomodoroSessions: pomodoroSessionsTable,
  pomodoroLog: pomodoroLogTable
};