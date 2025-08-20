import { serial, text, pgTable, timestamp, numeric, integer } from 'drizzle-orm/pg-core';

export const citiesTable = pgTable('cities', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  country: text('country').notNull(),
  latitude: numeric('latitude', { precision: 10, scale: 7 }).notNull(),
  longitude: numeric('longitude', { precision: 10, scale: 7 }).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const weatherForecastsTable = pgTable('weather_forecasts', {
  id: serial('id').primaryKey(),
  city_id: integer('city_id').references(() => citiesTable.id).notNull(),
  date: timestamp('date').notNull(),
  temperature: numeric('temperature', { precision: 5, scale: 2 }).notNull(),
  precipitation_probability: integer('precipitation_probability').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// TypeScript types for the table schemas
export type City = typeof citiesTable.$inferSelect;
export type NewCity = typeof citiesTable.$inferInsert;

export type DbWeatherForecast = typeof weatherForecastsTable.$inferSelect;
export type NewWeatherForecast = typeof weatherForecastsTable.$inferInsert;

// Export all tables for relation queries
export const tables = { cities: citiesTable, weatherForecasts: weatherForecastsTable };
