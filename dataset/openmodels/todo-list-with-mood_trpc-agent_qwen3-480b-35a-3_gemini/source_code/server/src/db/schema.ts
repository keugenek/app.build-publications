import { serial, text, pgTable, timestamp, integer, boolean } from 'drizzle-orm/pg-core';

export const tasksTable = pgTable('tasks', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  completed: boolean('completed').notNull().default(false),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

export const moodsTable = pgTable('moods', {
  id: serial('id').primaryKey(),
  mood: integer('mood').notNull(),
  description: text('description'),
  created_at: timestamp('created_at').defaultNow().notNull()
});

// TypeScript types for the table schemas
export type Task = typeof tasksTable.$inferSelect;
export type NewTask = typeof tasksTable.$inferInsert;

export type Mood = typeof moodsTable.$inferSelect;
export type NewMood = typeof moodsTable.$inferInsert;

// Export all tables for relation queries
export const tables = { tasks: tasksTable, moods: moodsTable };
