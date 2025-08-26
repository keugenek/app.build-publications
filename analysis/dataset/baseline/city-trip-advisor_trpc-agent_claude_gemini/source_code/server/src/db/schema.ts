import { serial, text, pgTable, timestamp, real, boolean } from 'drizzle-orm/pg-core';

export const tripHistoryTable = pgTable('trip_history', {
  id: serial('id').primaryKey(),
  city: text('city').notNull(),
  is_good_idea: boolean('is_good_idea').notNull(),
  max_temperature: real('max_temperature').notNull(),
  precipitation: real('precipitation').notNull(),
  weather_description: text('weather_description').notNull(),
  forecast_date: timestamp('forecast_date').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// TypeScript types for the table schema
export type TripHistory = typeof tripHistoryTable.$inferSelect; // For SELECT operations
export type NewTripHistory = typeof tripHistoryTable.$inferInsert; // For INSERT operations

// Important: Export all tables for proper query building
export const tables = { tripHistory: tripHistoryTable };
