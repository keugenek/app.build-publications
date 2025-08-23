import { serial, date, pgTable, timestamp, numeric, integer } from 'drizzle-orm/pg-core';

export const wellnessEntriesTable = pgTable('wellness_entries', {
  id: serial('id').primaryKey(),
  date: date('date').notNull(), // Date of the entry
  sleep_hours: numeric('sleep_hours', { precision: 3, scale: 1 }).notNull(), // Hours of sleep (0-24)
  stress_level: integer('stress_level').notNull(), // Stress level (1-10)
  caffeine_intake: integer('caffeine_intake').notNull(), // Number of caffeine drinks
  alcohol_intake: integer('alcohol_intake').notNull(), // Number of alcohol drinks
  wellness_score: numeric('wellness_score', { precision: 5, scale: 2 }).notNull(), // Calculated wellness score
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// TypeScript types for the table schema
export type WellnessEntry = typeof wellnessEntriesTable.$inferSelect; // For SELECT operations
export type NewWellnessEntry = typeof wellnessEntriesTable.$inferInsert; // For INSERT operations

// Export all tables for relation queries
export const tables = { wellnessEntries: wellnessEntriesTable };
