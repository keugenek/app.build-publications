import { serial, text, pgTable, timestamp, boolean, integer, date } from 'drizzle-orm/pg-core';

export const tasksTable = pgTable('tasks', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'), // Nullable by default
  is_completed: boolean('is_completed').notNull().default(false),
  created_at: timestamp('created_at').defaultNow().notNull(),
  completed_at: timestamp('completed_at'), // Nullable, set when task is completed
});

export const moodEntriesTable = pgTable('mood_entries', {
  id: serial('id').primaryKey(),
  mood_rating: integer('mood_rating').notNull(), // 1-5 scale
  note: text('note'), // Optional text note
  date: date('date').notNull(), // The date this mood entry represents
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// TypeScript types for the table schemas
export type Task = typeof tasksTable.$inferSelect; // For SELECT operations
export type NewTask = typeof tasksTable.$inferInsert; // For INSERT operations

export type MoodEntry = typeof moodEntriesTable.$inferSelect; // For SELECT operations
export type NewMoodEntry = typeof moodEntriesTable.$inferInsert; // For INSERT operations

// Important: Export all tables and relations for proper query building
export const tables = { 
  tasks: tasksTable, 
  mood_entries: moodEntriesTable 
};
