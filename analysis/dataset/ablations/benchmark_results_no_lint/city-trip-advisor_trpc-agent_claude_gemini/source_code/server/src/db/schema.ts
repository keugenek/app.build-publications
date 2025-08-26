import { serial, text, pgTable, timestamp, numeric, boolean } from 'drizzle-orm/pg-core';

// Trip suggestions history table to store user queries and results
export const tripSuggestionsTable = pgTable('trip_suggestions', {
  id: serial('id').primaryKey(),
  city: text('city').notNull(),
  temperature: numeric('temperature', { precision: 5, scale: 2 }).notNull(),
  precipitation: numeric('precipitation', { precision: 5, scale: 2 }).notNull(),
  is_good_idea: boolean('is_good_idea').notNull(),
  message: text('message').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// TypeScript type for the table schema
export type TripSuggestion = typeof tripSuggestionsTable.$inferSelect; // For SELECT operations
export type NewTripSuggestion = typeof tripSuggestionsTable.$inferInsert; // For INSERT operations

// Important: Export all tables for proper query building
export const tables = { tripSuggestions: tripSuggestionsTable };
