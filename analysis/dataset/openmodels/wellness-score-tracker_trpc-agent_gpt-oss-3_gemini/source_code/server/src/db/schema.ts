import { pgTable, serial, numeric, integer, timestamp } from 'drizzle-orm/pg-core';

// Table for storing daily wellness entries
export const wellnessEntriesTable = pgTable('wellness_entries', {
  id: serial('id').primaryKey(),
  sleep_hours: numeric('sleep_hours', { precision: 5, scale: 2 }).notNull(), // e.g., 7.5 hours
  stress_level: integer('stress_level').notNull(), // 1-5 scale
  caffeine_servings: integer('caffeine_servings').notNull(),
  alcohol_servings: integer('alcohol_servings').notNull(),
  wellness_score: numeric('wellness_score', { precision: 5, scale: 2 }).notNull(), // 0-100 score
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Types inferred from the table definition
export type WellnessEntry = typeof wellnessEntriesTable.$inferSelect;
export type NewWellnessEntry = typeof wellnessEntriesTable.$inferInsert;

// Export all tables for relation queries
export const tables = {
  wellnessEntries: wellnessEntriesTable,
};
