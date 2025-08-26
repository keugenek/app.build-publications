import { pgTable, serial, text, timestamp, integer, numeric, varchar, foreignKey } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// JLPT levels enum
export const jlptLevels = ['N5', 'N4', 'N3', 'N2', 'N1'] as const;

// Kanji table
export const kanjiTable = pgTable('kanji', {
  id: serial('id').primaryKey(),
  character: varchar('character', { length: 10 }).notNull(),
  meaning: text('meaning').notNull(),
  kunReading: varchar('kun_reading', { length: 100 }),
  onReading: varchar('on_reading', { length: 100 }),
  jlptLevel: text('jlpt_level', { enum: jlptLevels }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Flashcard table for SRS system
export const flashcardTable = pgTable('flashcard', {
  id: serial('id').primaryKey(),
  kanjiId: integer('kanji_id').notNull().references(() => kanjiTable.id),
  userId: varchar('user_id', { length: 100 }).notNull(),
  nextReviewDate: timestamp('next_review_date').notNull(),
  interval: integer('interval').notNull(), // Days until next review
  easeFactor: numeric('ease_factor', { precision: 3, scale: 2 }).notNull(), // Factor for spacing reviews
  repetitionCount: integer('repetition_count').notNull(), // How many times reviewed
  lastReviewedAt: timestamp('last_reviewed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// User progress table
export const userProgressTable = pgTable('user_progress', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id', { length: 100 }).notNull(),
  jlptLevel: text('jlpt_level', { enum: jlptLevels }).notNull(),
  masteredKanjiCount: integer('mastered_kanji_count').notNull(),
  totalKanjiCount: integer('total_kanji_count').notNull(),
  lastUpdated: timestamp('last_updated').defaultNow().notNull(),
});

// TypeScript types for the tables
export type Kanji = typeof kanjiTable.$inferSelect;
export type NewKanji = typeof kanjiTable.$inferInsert;

export type Flashcard = typeof flashcardTable.$inferSelect;
export type NewFlashcard = typeof flashcardTable.$inferInsert;

export type UserProgress = typeof userProgressTable.$inferSelect;
export type NewUserProgress = typeof userProgressTable.$inferInsert;

// Export all tables for relation queries
export const tables = { 
  kanji: kanjiTable, 
  flashcard: flashcardTable, 
  userProgress: userProgressTable 
};
