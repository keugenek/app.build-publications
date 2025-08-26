import { pgTable, serial, text, boolean, timestamp, date, pgEnum, integer } from 'drizzle-orm/pg-core';

// Task table
export const tasksTable = pgTable('tasks', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'), // nullable
  completed: boolean('completed').notNull().default(false),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Mood enum definition
export const moodEnum = pgEnum('mood', ['Happy', 'Sad', 'Neutral', 'Anxious', 'Excited']);

// Mood log table
export const moodLogsTable = pgTable('mood_logs', {
  id: serial('id').primaryKey(),
  mood: moodEnum('mood'), // reference enum
  log_date: date('log_date').notNull(),
  note: text('note'), // nullable
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Export types for SELECT and INSERT
export type Task = typeof tasksTable.$inferSelect;
export type NewTask = typeof tasksTable.$inferInsert;

export type MoodLog = typeof moodLogsTable.$inferSelect;
export type NewMoodLog = typeof moodLogsTable.$inferInsert;

// Export tables for relation queries
export const tables = { tasks: tasksTable, moodLogs: moodLogsTable };
