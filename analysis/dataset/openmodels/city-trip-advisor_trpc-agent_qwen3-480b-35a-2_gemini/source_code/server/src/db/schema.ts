import { serial, text, pgTable, timestamp, numeric, integer } from 'drizzle-orm/pg-core';

// Since this application doesn't require persistent storage of weather data,
// we'll create a simple table for logging requests if needed in the future
export const tripSuggestionsTable = pgTable('trip_suggestions', {
  id: serial('id').primaryKey(),
  city: text('city').notNull(),
  max_temperature: numeric('max_temperature', { precision: 5, scale: 2 }).notNull(),
  precipitation_probability: integer('precipitation_probability').notNull(),
  is_good_idea: numeric('is_good_idea').notNull(), // 1 for true, 0 for false
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// TypeScript types for the table schema
export type TripSuggestion = typeof tripSuggestionsTable.$inferSelect; // For SELECT operations
export type NewTripSuggestion = typeof tripSuggestionsTable.$inferInsert; // For INSERT operations

// Important: Export all tables and relations for proper query building
export const tables = { tripSuggestions: tripSuggestionsTable };
