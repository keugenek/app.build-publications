import { serial, text, pgTable, timestamp, boolean } from 'drizzle-orm/pg-core';

export const choresTable = pgTable('chores', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  is_completed: boolean('is_completed').notNull().default(false),
  assigned_date: timestamp('assigned_date').notNull(), // Date when chore was assigned for the week
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// TypeScript type for the table schema
export type Chore = typeof choresTable.$inferSelect; // For SELECT operations
export type NewChore = typeof choresTable.$inferInsert; // For INSERT operations

// Important: Export all tables for proper query building
export const tables = { chores: choresTable };
