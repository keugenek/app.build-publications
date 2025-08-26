import { serial, text, pgTable, timestamp, date } from 'drizzle-orm/pg-core';

export const eventsTable = pgTable('events', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  date: date('date').notNull(), // Use date type for event dates
  description: text('description').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// TypeScript type for the table schema
export type Event = typeof eventsTable.$inferSelect; // For SELECT operations
export type NewEvent = typeof eventsTable.$inferInsert; // For INSERT operations

// Important: Export all tables and relations for proper query building
export const tables = { events: eventsTable };
