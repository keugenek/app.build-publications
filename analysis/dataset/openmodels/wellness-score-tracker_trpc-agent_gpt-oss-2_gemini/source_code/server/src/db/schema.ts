import { pgTable, serial, date, integer, numeric, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// Wellness entry table
export const wellnessEntries = pgTable('wellness_entries', {
  id: serial('id').primaryKey(),
  date: date('date').notNull(), // stored as DATE, not null
  sleep_hours: numeric('sleep_hours', { precision: 4, scale: 2 }).notNull(), // e.g., 7.5
  stress_level: integer('stress_level').notNull(),
  caffeine_servings: integer('caffeine_servings').notNull(),
  alcohol_servings: integer('alcohol_servings').notNull(),
  wellness_score: numeric('wellness_score', { precision: 6, scale: 2 }).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Export table types for SELECT and INSERT
export type WellnessEntry = typeof wellnessEntries.$inferSelect;
export type NewWellnessEntry = typeof wellnessEntries.$inferInsert;

export const tables = { wellnessEntries };
