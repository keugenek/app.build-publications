import { pgTable, serial, text, boolean, timestamp, integer, date } from 'drizzle-orm/pg-core';

/**
 * Tasks table definition
 */
export const tasksTable = pgTable('tasks', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'), // nullable by default
  completed: boolean('completed').notNull().default(false),
  due_date: timestamp('due_date'), // nullable timestamp
  created_at: timestamp('created_at').defaultNow().notNull(),
});

/**
 * Mood entries table definition
 */
export const moodEntriesTable = pgTable('mood_entries', {
  id: serial('id').primaryKey(),
  date: date('date').notNull(),
  rating: integer('rating').notNull(), // rating from 1 to 10
  note: text('note'), // nullable
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Export table types for usage with Drizzle ORM
export type Task = typeof tasksTable.$inferSelect;
export type NewTask = typeof tasksTable.$inferInsert;

export type MoodEntry = typeof moodEntriesTable.$inferSelect;
export type NewMoodEntry = typeof moodEntriesTable.$inferInsert;

// Export all tables for relation queries
export const tables = {
  tasks: tasksTable,
  mood_entries: moodEntriesTable,
};
