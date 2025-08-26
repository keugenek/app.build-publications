import { serial, text, pgTable, timestamp, boolean, date, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Mood enum for PostgreSQL
export const moodEnum = pgEnum('mood', ['very_sad', 'sad', 'neutral', 'happy', 'very_happy']);

// Daily entries table
export const dailyEntriesTable = pgTable('daily_entries', {
  id: serial('id').primaryKey(),
  date: date('date').notNull().unique(), // One entry per day
  mood: moodEnum('mood'), // Nullable - user might not log mood every day
  notes: text('notes'), // Nullable - optional notes for the day
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Tasks table
export const tasksTable = pgTable('tasks', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'), // Nullable - optional task description
  is_completed: boolean('is_completed').default(false).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  completed_at: timestamp('completed_at'), // Nullable - only set when task is completed
  daily_entry_id: serial('daily_entry_id').references(() => dailyEntriesTable.id).notNull(),
});

// Relations
export const dailyEntriesRelations = relations(dailyEntriesTable, ({ many }) => ({
  tasks: many(tasksTable),
}));

export const tasksRelations = relations(tasksTable, ({ one }) => ({
  dailyEntry: one(dailyEntriesTable, {
    fields: [tasksTable.daily_entry_id],
    references: [dailyEntriesTable.id],
  }),
}));

// TypeScript types for the table schemas
export type DailyEntry = typeof dailyEntriesTable.$inferSelect;
export type NewDailyEntry = typeof dailyEntriesTable.$inferInsert;
export type Task = typeof tasksTable.$inferSelect;
export type NewTask = typeof tasksTable.$inferInsert;

// Export all tables and relations for proper query building
export const tables = { 
  dailyEntries: dailyEntriesTable, 
  tasks: tasksTable 
};

export const tableRelations = {
  dailyEntriesRelations,
  tasksRelations
};
