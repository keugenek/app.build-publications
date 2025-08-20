import { serial, text, pgTable, timestamp, integer, boolean, date } from 'drizzle-orm/pg-core';

// Tasks table
export const tasksTable = pgTable('tasks', {
  id: serial('id').primaryKey(),
  description: text('description').notNull(),
  completed: boolean('completed').notNull().default(false),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
  completed_at: timestamp('completed_at') // Nullable - only set when task is completed
});

// Mood entries table
export const moodEntriesTable = pgTable('mood_entries', {
  id: serial('id').primaryKey(),
  date: date('date').notNull(), // Store date without time for daily entries
  mood_score: integer('mood_score').notNull(), // 1-5 scale
  note: text('note'), // Nullable - optional description
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// TypeScript types for the table schemas
export type Task = typeof tasksTable.$inferSelect;
export type NewTask = typeof tasksTable.$inferInsert;

export type MoodEntry = typeof moodEntriesTable.$inferSelect;
export type NewMoodEntry = typeof moodEntriesTable.$inferInsert;

// Export all tables for proper query building
export const tables = { 
  tasks: tasksTable, 
  mood_entries: moodEntriesTable 
};
