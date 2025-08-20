import { pgTable, serial, text, timestamp, date, integer } from 'drizzle-orm/pg-core';

export const eventsTable = pgTable('events', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  date: date('date').notNull(),
  description: text('description'), // nullable by default
  created_at: timestamp('created_at').defaultNow().notNull()
});

// Types for select and insert
export type Event = typeof eventsTable.$inferSelect;
export type NewEvent = typeof eventsTable.$inferInsert;

export const tables = { events: eventsTable };
