import { serial, text, pgTable, timestamp } from 'drizzle-orm/pg-core';

export const eventsTable = pgTable('events', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'), // Nullable by default, matches Zod schema
  date: timestamp('date').notNull(), // Event date/time
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// TypeScript type for the table schema
export type Event = typeof eventsTable.$inferSelect; // For SELECT operations
export type NewEvent = typeof eventsTable.$inferInsert; // For INSERT operations

// Important: Export all tables and relations for proper query building
export const tables = { events: eventsTable };
