import { pgTable, serial, timestamp, numeric, integer, text } from 'drizzle-orm/pg-core';

// Table definition for wellness entries
export const wellnessEntries = pgTable('wellness_entries', {
  id: serial('id').primaryKey(),
  entry_date: timestamp('entry_date').notNull(),
  sleep_hours: numeric('sleep_hours', { precision: 4, scale: 2 }).notNull(),
  stress_level: integer('stress_level').notNull(),
  caffeine_intake: numeric('caffeine_intake', { precision: 6, scale: 2 }).notNull(),
  alcohol_intake: numeric('alcohol_intake', { precision: 6, scale: 2 }).notNull(),
  wellness_score: numeric('wellness_score', { precision: 5, scale: 2 }).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Types inferred from the table schema
export type WellnessEntry = typeof wellnessEntries.$inferSelect;
export type NewWellnessEntry = typeof wellnessEntries.$inferInsert;

// Export tables object for relation queries (if needed in future)
export const tables = { wellnessEntries };
