import { integer, pgTable, timestamp } from 'drizzle-orm/pg-core';

export const counterTable = pgTable('counter', {
  id: integer('id').primaryKey(),
  value: integer('value').notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// TypeScript types for the table schema
export type Counter = typeof counterTable.$inferSelect; // For SELECT operations
export type NewCounter = typeof counterTable.$inferInsert; // For INSERT operations

// Export all tables for relation queries
export const tables = { counter: counterTable };