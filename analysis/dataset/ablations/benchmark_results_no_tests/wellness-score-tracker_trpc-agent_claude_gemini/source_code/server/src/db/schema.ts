import { serial, text, pgTable, timestamp, numeric, integer, date } from 'drizzle-orm/pg-core';

export const wellnessEntriesTable = pgTable('wellness_entries', {
  id: serial('id').primaryKey(),
  user_id: text('user_id').notNull(), // User identifier
  date: date('date').notNull(), // Date of the wellness entry
  sleep_hours: numeric('sleep_hours', { precision: 4, scale: 2 }).notNull(), // Hours of sleep with decimal precision
  stress_level: integer('stress_level').notNull(), // Stress level (1-10 scale)
  caffeine_intake: numeric('caffeine_intake', { precision: 8, scale: 2 }).notNull(), // Caffeine intake in mg
  alcohol_intake: numeric('alcohol_intake', { precision: 6, scale: 2 }).notNull(), // Alcohol intake in standard drinks
  wellness_score: numeric('wellness_score', { precision: 5, scale: 2 }).notNull(), // Calculated wellness score (0-100)
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// TypeScript types for the table schema
export type WellnessEntry = typeof wellnessEntriesTable.$inferSelect; // For SELECT operations
export type NewWellnessEntry = typeof wellnessEntriesTable.$inferInsert; // For INSERT operations

// Important: Export all tables for proper query building
export const tables = { wellnessEntries: wellnessEntriesTable };
