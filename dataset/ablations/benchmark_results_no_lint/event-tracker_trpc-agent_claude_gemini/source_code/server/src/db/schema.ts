import { serial, text, pgTable, timestamp, date } from 'drizzle-orm/pg-core';

export const eventsTable = pgTable('events', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'), // Nullable by default, matches Zod schema
  date: date('date').notNull(), // Use date for date-only values
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// TypeScript type for the table schema
export type Event = typeof eventsTable.$inferSelect; // For SELECT operations
export type NewEvent = typeof eventsTable.$inferInsert; // For INSERT operations

// Important: Export all tables for proper query building
export const tables = { events: eventsTable };
