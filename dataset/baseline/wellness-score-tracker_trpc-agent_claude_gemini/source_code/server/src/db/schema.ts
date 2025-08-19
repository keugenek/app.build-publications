import { serial, text, pgTable, timestamp, numeric, integer, date } from 'drizzle-orm/pg-core';

export const wellnessEntriesTable = pgTable('wellness_entries', {
  id: serial('id').primaryKey(),
  sleep_hours: numeric('sleep_hours', { precision: 4, scale: 2 }).notNull(), // Hours with decimal precision
  stress_level: integer('stress_level').notNull(), // Integer scale 1-10
  caffeine_intake: numeric('caffeine_intake', { precision: 8, scale: 2 }).notNull(), // Caffeine in mg
  alcohol_intake: numeric('alcohol_intake', { precision: 6, scale: 2 }).notNull(), // Alcohol units
  wellness_score: numeric('wellness_score', { precision: 5, scale: 2 }).notNull(), // Calculated wellness score
  entry_date: date('entry_date').notNull(), // Date of the wellness entry (without time)
  created_at: timestamp('created_at').defaultNow().notNull(), // When record was created
});

// TypeScript types for the table schema
export type WellnessEntry = typeof wellnessEntriesTable.$inferSelect; // For SELECT operations
export type NewWellnessEntry = typeof wellnessEntriesTable.$inferInsert; // For INSERT operations

// Important: Export all tables for proper query building
export const tables = { wellnessEntries: wellnessEntriesTable };
