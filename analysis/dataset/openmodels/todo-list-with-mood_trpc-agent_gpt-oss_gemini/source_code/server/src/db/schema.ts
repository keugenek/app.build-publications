import { pgTable, serial, text, boolean, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { moodEnum } from '../schema';

// Define PostgreSQL enum for mood values (must match Zod enum)
export const moodPgEnum = pgEnum('mood', moodEnum.options);

// Tasks table definition
export const tasksTable = pgTable('tasks', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'), // nullable by default
  completed: boolean('completed').default(false).notNull(),
  due_date: timestamp('due_date'), // nullable by default
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Moods table definition
export const moodsTable = pgTable('moods', {
  id: serial('id').primaryKey(),
  date: timestamp('date').notNull(),
  mood: moodPgEnum('mood').notNull(),
  note: text('note'), // nullable
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Types for SELECT and INSERT operations
export type Task = typeof tasksTable.$inferSelect;
export type NewTask = typeof tasksTable.$inferInsert;

export type MoodEntry = typeof moodsTable.$inferSelect;
export type NewMoodEntry = typeof moodsTable.$inferInsert;

// Export all tables for relation queries
export const tables = {
  tasks: tasksTable,
  moods: moodsTable,
};
