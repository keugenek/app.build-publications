import { serial, text, pgTable, timestamp, real, date } from 'drizzle-orm/pg-core';

// Weather cache table to store weather data and avoid excessive API calls
export const weatherCacheTable = pgTable('weather_cache', {
  id: serial('id').primaryKey(),
  city: text('city').notNull(),
  temperature: real('temperature').notNull(), // Temperature in Celsius
  precipitation: real('precipitation').notNull(), // Precipitation in mm
  weather_description: text('weather_description').notNull(),
  date: date('date').notNull(), // Date for which the weather data is valid
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// TypeScript types for the table schema
export type WeatherCache = typeof weatherCacheTable.$inferSelect; // For SELECT operations
export type NewWeatherCache = typeof weatherCacheTable.$inferInsert; // For INSERT operations

// Important: Export all tables for proper query building
export const tables = { weatherCache: weatherCacheTable };
