import { serial, text, pgTable, timestamp, boolean, integer, date } from 'drizzle-orm/pg-core';

// Tasks table
export const tasksTable = pgTable('tasks', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  is_completed: boolean('is_completed').default(false).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Mood entries table
export const moodEntriesTable = pgTable('mood_entries', {
  id: serial('id').primaryKey(),
  mood_score: integer('mood_score').notNull(), // 1-5 scale
  notes: text('notes'), // Nullable by default
  entry_date: date('entry_date').notNull(), // Date of the mood entry (without time)
  created_at: timestamp('created_at').defaultNow().notNull()
});

// TypeScript types for the table schemas
export type Task = typeof tasksTable.$inferSelect; // For SELECT operations
export type NewTask = typeof tasksTable.$inferInsert; // For INSERT operations

export type MoodEntry = typeof moodEntriesTable.$inferSelect; // For SELECT operations
export type NewMoodEntry = typeof moodEntriesTable.$inferInsert; // For INSERT operations

// Important: Export all tables for proper query building
export const tables = { 
  tasks: tasksTable,
  moodEntries: moodEntriesTable
};
