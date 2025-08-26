import { serial, text, pgTable, timestamp, integer, date, pgEnum } from 'drizzle-orm/pg-core';

// JLPT level enum
export const jlptLevelEnum = pgEnum('jlpt_level', ['N1', 'N2', 'N3', 'N4', 'N5']);

// Kanji table
export const kanjiTable = pgTable('kanji', {
  id: serial('id').primaryKey(),
  kanji: text('kanji').notNull(), // The actual kanji character
  meaning: text('meaning').notNull(), // English meaning
  onyomi: text('onyomi'), // Chinese reading (nullable)
  kunyomi: text('kunyomi'), // Japanese reading (nullable)
  jlpt_level: jlptLevelEnum('jlpt_level').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Spaced Repetition System (SRS) entries table
export const srsEntriesTable = pgTable('srs_entries', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull(),
  kanji_id: integer('kanji_id').notNull(),
  familiarity_level: integer('familiarity_level').notNull(), // 0-5 scale
  next_review_date: date('next_review_date').notNull(),
  last_reviewed_at: timestamp('last_reviewed_at'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// TypeScript types for the table schemas
export type Kanji = typeof kanjiTable.$inferSelect;
export type NewKanji = typeof kanjiTable.$inferInsert;

export type SrsEntry = typeof srsEntriesTable.$inferSelect;
export type NewSrsEntry = typeof srsEntriesTable.$inferInsert;

// Export tables for relation queries
export const tables = { 
  kanji: kanjiTable, 
  srsEntries: srsEntriesTable 
};
