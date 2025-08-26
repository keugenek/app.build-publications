import { serial, text, pgTable, timestamp, date } from 'drizzle-orm/pg-core';

export const eventsTable = pgTable('events', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  date: date('date').notNull(), // Only date, no time component
  description: text('description'), // Nullable for optional descriptions
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// TypeScript types for the table schema
export type Event = typeof eventsTable.$inferSelect; // For SELECT operations
export type NewEvent = typeof eventsTable.$inferInsert; // For INSERT operations

// Export all tables for proper query building
export const tables = { events: eventsTable };
