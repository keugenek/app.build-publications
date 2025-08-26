import { serial, text, pgTable, timestamp, boolean, pgEnum } from 'drizzle-orm/pg-core';

// Define mood enum for PostgreSQL
export const moodEnum = pgEnum('mood', ['Happy', 'Sad', 'Neutral', 'Anxious', 'Excited']);

// Tasks table
export const tasksTable = pgTable('tasks', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  due_date: timestamp('due_date').notNull(),
  completed: boolean('completed').notNull().default(false),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Mood logs table
export const moodLogsTable = pgTable('mood_logs', {
  id: serial('id').primaryKey(),
  mood: moodEnum('mood').notNull(),
  note: text('note'),
  logged_at: timestamp('logged_at').defaultNow().notNull()
});

// TypeScript types for the tables
export type Task = typeof tasksTable.$inferSelect;
export type NewTask = typeof tasksTable.$inferInsert;

export type MoodLog = typeof moodLogsTable.$inferSelect;
export type NewMoodLog = typeof moodLogsTable.$inferInsert;

// Export all tables for relation queries
export const tables = { tasks: tasksTable, moodLogs: moodLogsTable };
