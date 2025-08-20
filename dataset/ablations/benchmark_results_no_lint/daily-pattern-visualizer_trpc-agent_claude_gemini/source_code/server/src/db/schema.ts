import { serial, text, pgTable, timestamp, real, integer, date, index } from 'drizzle-orm/pg-core';

export const wellBeingEntriesTable = pgTable('well_being_entries', {
  id: serial('id').primaryKey(),
  date: date('date').notNull(), // Store date without time component
  sleep_hours: real('sleep_hours').notNull(), // Use real for decimal hours
  work_hours: real('work_hours').notNull(),
  social_time_hours: real('social_time_hours').notNull(),
  screen_time_hours: real('screen_time_hours').notNull(),
  emotional_energy_level: integer('emotional_energy_level').notNull(), // Integer for 1-10 scale
  created_at: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  // Index on date for faster queries when filtering by date range
  dateIdx: index('well_being_entries_date_idx').on(table.date),
  // Index on created_at for chronological ordering
  createdAtIdx: index('well_being_entries_created_at_idx').on(table.created_at),
}));

// TypeScript types for the table schema
export type WellBeingEntry = typeof wellBeingEntriesTable.$inferSelect; // For SELECT operations
export type NewWellBeingEntry = typeof wellBeingEntriesTable.$inferInsert; // For INSERT operations

// Important: Export all tables for proper query building
export const tables = { 
  wellBeingEntries: wellBeingEntriesTable 
};
