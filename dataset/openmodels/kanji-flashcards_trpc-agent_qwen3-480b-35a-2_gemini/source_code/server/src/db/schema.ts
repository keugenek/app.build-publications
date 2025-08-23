import { serial, text, pgTable, timestamp, integer, pgEnum as drizzleEnum } from 'drizzle-orm/pg-core';

// JLPT Level enum
export const jlptLevelEnum = drizzleEnum('jlpt_level', ['N5', 'N4', 'N3', 'N2', 'N1']);

// Kanji table
export const kanjiTable = pgTable('kanji', {
  id: serial('id').primaryKey(),
  character: text('character').notNull(),
  meaning: text('meaning').notNull(),
  kunyomi: text('kunyomi'), // Nullable
  onyomi: text('onyomi'), // Nullable
  jlpt_level: jlptLevelEnum('jlpt_level').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// SRS Entries table
export const srsEntriesTable = pgTable('srs_entries', {
  id: serial('id').primaryKey(),
  user_id: text('user_id').notNull(),
  kanji_id: integer('kanji_id').notNull(),
  ease: integer('ease').notNull(), // How easy the user finds this kanji (1-4)
  interval: integer('interval').notNull(), // Days until next review
  due_date: timestamp('due_date').notNull(), // When the next review is due
  last_reviewed: timestamp('last_reviewed'), // Nullable
  review_count: integer('review_count').notNull().default(0),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// TypeScript types for the table schemas
export type Kanji = typeof kanjiTable.$inferSelect;
export type NewKanji = typeof kanjiTable.$inferInsert;

export type SRSEntry = typeof srsEntriesTable.$inferSelect;
export type NewSRSEntry = typeof srsEntriesTable.$inferInsert;

// Export all tables for relation queries
export const tables = { kanji: kanjiTable, srsEntries: srsEntriesTable };