import { serial, text, pgTable, timestamp, numeric, pgEnum } from 'drizzle-orm/pg-core';

// Enum for trip suggestion values
export const suggestionEnum = pgEnum('suggestion', ['Yes', 'No']);

export const tripSuggestionsTable = pgTable('trip_suggestions', {
  id: serial('id').primaryKey(),
  city: text('city').notNull(),
  suggestion: suggestionEnum('suggestion').notNull(),
  temperature_min: numeric('temperature_min', { precision: 5, scale: 2 }).notNull(),
  temperature_max: numeric('temperature_max', { precision: 5, scale: 2 }).notNull(),
  precipitation: numeric('precipitation', { precision: 8, scale: 2 }).notNull(), // mm of precipitation
  forecast_date: timestamp('forecast_date').notNull(),
  reasoning: text('reasoning').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// TypeScript types for the table schema
export type TripSuggestion = typeof tripSuggestionsTable.$inferSelect; // For SELECT operations
export type NewTripSuggestion = typeof tripSuggestionsTable.$inferInsert; // For INSERT operations

// Important: Export all tables for proper query building
export const tables = { tripSuggestions: tripSuggestionsTable };
