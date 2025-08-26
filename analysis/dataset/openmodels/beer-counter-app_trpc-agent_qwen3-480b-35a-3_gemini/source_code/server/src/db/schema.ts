import { serial, integer, pgTable, timestamp } from 'drizzle-orm/pg-core';

export const countersTable = pgTable('counters', {
  id: serial('id').primaryKey(),
  count: integer('count').notNull().default(0),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// TypeScript types for the table schema
export type Counter = typeof countersTable.$inferSelect; // For SELECT operations
export type NewCounter = typeof countersTable.$inferInsert; // For INSERT operations

// Export all tables for relation queries
export const tables = { counters: countersTable };
