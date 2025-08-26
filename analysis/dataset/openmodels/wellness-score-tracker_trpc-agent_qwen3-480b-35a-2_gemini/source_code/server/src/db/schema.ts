import { serial, date, pgTable, timestamp, numeric, integer } from 'drizzle-orm/pg-core';

export const wellnessEntriesTable = pgTable('wellness_entries', {
  id: serial('id').primaryKey(),
  date: date('date').notNull(), // Date of the wellness entry
  sleep_hours: numeric('sleep_hours', { precision: 4, scale: 2 }).notNull(), // Hours of sleep (e.g., 7.5 hours)
  stress_level: integer('stress_level').notNull(), // Stress level (1-10 scale)
  caffeine_intake: numeric('caffeine_intake', { precision: 4, scale: 2 }).notNull(), // Caffeine intake (number of servings)
  alcohol_intake: numeric('alcohol_intake', { precision: 4, scale: 2 }).notNull(), // Alcohol intake (number of servings)
  wellness_score: numeric('wellness_score', { precision: 5, scale: 2 }).notNull(), // Calculated wellness score
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// TypeScript types for the table schema
export type WellnessEntry = typeof wellnessEntriesTable.$inferSelect; // For SELECT operations
export type NewWellnessEntry = typeof wellnessEntriesTable.$inferInsert; // For INSERT operations

// Important: Export all tables and relations for proper query building
export const tables = { wellnessEntries: wellnessEntriesTable };
