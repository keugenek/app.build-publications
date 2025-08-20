import { serial, text, pgTable, timestamp, numeric, integer, date } from 'drizzle-orm/pg-core';

export const wellnessEntriesTable = pgTable('wellness_entries', {
  id: serial('id').primaryKey(),
  user_id: text('user_id').notNull(), // String ID for user identification
  date: date('date').notNull(), // Date of the wellness entry (YYYY-MM-DD)
  sleep_hours: numeric('sleep_hours', { precision: 4, scale: 2 }).notNull(), // Hours with decimal precision
  stress_level: integer('stress_level').notNull(), // Integer from 1-10
  caffeine_intake: integer('caffeine_intake').notNull(), // Caffeine in mg
  alcohol_intake: integer('alcohol_intake').notNull(), // Alcohol in units/drinks
  wellness_score: numeric('wellness_score', { precision: 5, scale: 2 }).notNull(), // Calculated score with precision
  created_at: timestamp('created_at').defaultNow().notNull(), // Record creation timestamp
});

// TypeScript types for the table schema
export type WellnessEntry = typeof wellnessEntriesTable.$inferSelect; // For SELECT operations
export type NewWellnessEntry = typeof wellnessEntriesTable.$inferInsert; // For INSERT operations

// Important: Export all tables and relations for proper query building
export const tables = { wellnessEntries: wellnessEntriesTable };
