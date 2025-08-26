import { pgTable, serial, text, timestamp, pgEnum, integer } from 'drizzle-orm/pg-core';
import { type InferSelectModel, type InferInsertModel } from 'drizzle-orm';

// JLPT level enum definition matching Zod enum
export const jlptLevel = pgEnum('jlpt_level', ['N5', 'N4', 'N3', 'N2', 'N1'] as const);

export const kanjisTable = pgTable('kanjis', {
  id: serial('id').primaryKey(),
  character: text('character').notNull(),
  meaning: text('meaning').notNull(),
  onyomi: text('onyomi'), // nullable by default
  kunyomi: text('kunyomi'), // nullable by default
  jlpt_level: jlptLevel('jlpt_level').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const kanjiProgressTable = pgTable('kanji_progress', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull(),
  kanji_id: integer('kanji_id').notNull(),
  next_review: timestamp('next_review').notNull(),
  interval_days: integer('interval_days').notNull(), // positive int
  efactor: integer('efactor').notNull(), // storing as integer representing factor*100 maybe, but keep as int for simplicity
  last_reviewed_at: timestamp('last_reviewed_at'), // nullable
});

// Export TypeScript types for SELECT and INSERT operations
export type Kanji = InferSelectModel<typeof kanjisTable>;
export type NewKanji = InferInsertModel<typeof kanjisTable>;

export type KanjiProgress = InferSelectModel<typeof kanjiProgressTable>;
export type NewKanjiProgress = InferInsertModel<typeof kanjiProgressTable>;

// Export all tables for relation queries
export const tables = {
  kanjis: kanjisTable,
  kanjiProgress: kanjiProgressTable,
};
