import { serial, integer, pgTable, timestamp, numeric, text } from 'drizzle-orm/pg-core';

export const wellnessEntriesTable = pgTable('wellness_entries', {
  id: serial('id').primaryKey(),
  sleep_hours: numeric('sleep_hours', { precision: 4, scale: 2 }).notNull(), // Hours of sleep (0-24)
  stress_level: integer('stress_level').notNull(), // Stress level (1-10)
  caffeine_intake: integer('caffeine_intake').notNull(), // Number of caffeine servings
  alcohol_intake: integer('alcohol_intake').notNull(), // Number of alcohol units
  wellness_score: numeric('wellness_score', { precision: 6, scale: 2 }).notNull(), // Calculated wellness score
  created_at: timestamp('created_at').defaultNow().notNull(),
  user_id: text('user_id').notNull() // User identifier
});

// TypeScript types for the table schema
export type WellnessEntry = typeof wellnessEntriesTable.$inferSelect; // For SELECT operations
export type NewWellnessEntry = typeof wellnessEntriesTable.$inferInsert; // For INSERT operations

// Export all tables for relation queries
export const tables = { wellnessEntries: wellnessEntriesTable };
