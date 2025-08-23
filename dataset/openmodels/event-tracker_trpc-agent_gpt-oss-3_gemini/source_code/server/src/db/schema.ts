import { pgTable, serial, text, timestamp, date } from 'drizzle-orm/pg-core';

export const eventsTable = pgTable('events', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  date: date('date').notNull(), // stored as DATE type
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Types for SELECT and INSERT operations
export type Event = typeof eventsTable.$inferSelect;
export type NewEvent = typeof eventsTable.$inferInsert;

// Export tables collection for drizzle relation queries
export const tables = { events: eventsTable };
