import { serial, text, pgTable, timestamp } from 'drizzle-orm/pg-core';

export const eventsTable = pgTable('events', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'), // nullable by default
  event_date: timestamp('event_date').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Types for SELECT and INSERT operations
export type Event = typeof eventsTable.$inferSelect;
export type NewEvent = typeof eventsTable.$inferInsert;

export const tables = { events: eventsTable };
