import { serial, text, pgTable, timestamp, integer, boolean, date, numeric } from 'drizzle-orm/pg-core';

export const tasksTable = pgTable('tasks', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  completed: boolean('completed').notNull().default(false),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow(),
});

export const moodEntriesTable = pgTable('mood_entries', {
  id: serial('id').primaryKey(),
  date: date('date').notNull(),
  mood_level: integer('mood_level').notNull(),
  notes: text('notes'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// TypeScript types for the table schemas
export type Task = typeof tasksTable.$inferSelect;
export type NewTask = typeof tasksTable.$inferInsert;

export type MoodEntry = typeof moodEntriesTable.$inferSelect;
export type NewMoodEntry = typeof moodEntriesTable.$inferInsert;

// Important: Export all tables and relations for proper query building
export const tables = { tasks: tasksTable, moodEntries: moodEntriesTable };
