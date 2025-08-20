import { serial, integer, real, pgTable, timestamp, date, unique } from 'drizzle-orm/pg-core';

export const wellnessEntriesTable = pgTable('wellness_entries', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull(),
  date: date('date').notNull(), // Date of the wellness entry
  hours_of_sleep: real('hours_of_sleep').notNull(), // Allows decimal hours like 7.5
  stress_level: integer('stress_level').notNull(), // 1-10 scale
  caffeine_intake: real('caffeine_intake').notNull(), // in mg, allows decimals
  alcohol_intake: real('alcohol_intake').notNull(), // number of drinks, allows decimals
  wellness_score: real('wellness_score').notNull(), // calculated wellness score
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  // Ensure one entry per user per date
  uniqueUserDate: unique().on(table.user_id, table.date),
}));

// TypeScript types for the table schema
export type WellnessEntry = typeof wellnessEntriesTable.$inferSelect; // For SELECT operations
export type NewWellnessEntry = typeof wellnessEntriesTable.$inferInsert; // For INSERT operations

// Important: Export all tables for proper query building
export const tables = { 
  wellnessEntries: wellnessEntriesTable 
};
