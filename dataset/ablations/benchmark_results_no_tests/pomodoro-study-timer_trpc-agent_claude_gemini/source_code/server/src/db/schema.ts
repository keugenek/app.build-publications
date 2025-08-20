import { serial, text, pgTable, timestamp, integer, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enum for phase types
export const phaseTypeEnum = pgEnum('phase_type', ['work', 'short_break', 'long_break']);
export const currentPhaseEnum = pgEnum('current_phase', ['work', 'short_break', 'long_break', 'idle']);

// Pomodoro sessions table
export const pomodoroSessionsTable = pgTable('pomodoro_sessions', {
  id: serial('id').primaryKey(),
  work_duration: integer('work_duration').notNull(), // Duration in minutes
  short_break_duration: integer('short_break_duration').notNull(), // Duration in minutes
  long_break_duration: integer('long_break_duration').notNull(), // Duration in minutes
  long_break_interval: integer('long_break_interval').notNull(), // After how many pomodoros
  completed_pomodoros: integer('completed_pomodoros').notNull().default(0), // Number of completed pomodoros in session
  is_active: boolean('is_active').notNull().default(false),
  current_phase: currentPhaseEnum('current_phase').notNull().default('idle'),
  phase_start_time: timestamp('phase_start_time'), // Nullable - when current phase started
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Pomodoro log entries table
export const pomodoroLogsTable = pgTable('pomodoro_logs', {
  id: serial('id').primaryKey(),
  session_id: integer('session_id').notNull().references(() => pomodoroSessionsTable.id),
  phase_type: phaseTypeEnum('phase_type').notNull(),
  duration_minutes: integer('duration_minutes').notNull(),
  started_at: timestamp('started_at').notNull(),
  completed_at: timestamp('completed_at'), // Nullable - null if interrupted
  was_interrupted: boolean('was_interrupted').notNull().default(false),
});

// Relations
export const pomodoroSessionsRelations = relations(pomodoroSessionsTable, ({ many }) => ({
  logs: many(pomodoroLogsTable),
}));

export const pomodoroLogsRelations = relations(pomodoroLogsTable, ({ one }) => ({
  session: one(pomodoroSessionsTable, {
    fields: [pomodoroLogsTable.session_id],
    references: [pomodoroSessionsTable.id],
  }),
}));

// TypeScript types for the table schemas
export type PomodoroSession = typeof pomodoroSessionsTable.$inferSelect;
export type NewPomodoroSession = typeof pomodoroSessionsTable.$inferInsert;
export type PomodoroLog = typeof pomodoroLogsTable.$inferSelect;
export type NewPomodoroLog = typeof pomodoroLogsTable.$inferInsert;

// Export all tables for proper query building
export const tables = {
  pomodoroSessions: pomodoroSessionsTable,
  pomodoroLogs: pomodoroLogsTable,
};
