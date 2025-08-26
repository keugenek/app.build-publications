import { serial, text, pgTable, timestamp, integer, real, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// JLPT Level enum
export const jlptLevelEnum = pgEnum('jlpt_level', ['N5', 'N4', 'N3', 'N2', 'N1']);

// Kanji table
export const kanjiTable = pgTable('kanji', {
  id: serial('id').primaryKey(),
  character: text('character').notNull().unique(), // Each kanji character should be unique
  meaning: text('meaning').notNull(),
  kun_reading: text('kun_reading'), // Nullable - some kanji may not have kun readings
  on_reading: text('on_reading'), // Nullable - some kanji may not have on readings
  romaji: text('romaji'), // Nullable - romanized reading
  jlpt_level: jlptLevelEnum('jlpt_level').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// User progress table for SRS tracking
export const userProgressTable = pgTable('user_progress', {
  id: serial('id').primaryKey(),
  user_id: text('user_id').notNull(), // Simple string identifier for user
  kanji_id: integer('kanji_id').notNull().references(() => kanjiTable.id, { onDelete: 'cascade' }),
  correct_count: integer('correct_count').notNull().default(0),
  incorrect_count: integer('incorrect_count').notNull().default(0),
  current_interval: integer('current_interval').notNull().default(1), // Days between reviews
  ease_factor: real('ease_factor').notNull().default(2.5), // SRS ease factor
  next_review_date: timestamp('next_review_date').notNull().defaultNow(),
  last_reviewed_at: timestamp('last_reviewed_at'), // Nullable - null for never reviewed
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const kanjiRelations = relations(kanjiTable, ({ many }) => ({
  userProgress: many(userProgressTable),
}));

export const userProgressRelations = relations(userProgressTable, ({ one }) => ({
  kanji: one(kanjiTable, {
    fields: [userProgressTable.kanji_id],
    references: [kanjiTable.id],
  }),
}));

// TypeScript types for the table schemas
export type Kanji = typeof kanjiTable.$inferSelect;
export type NewKanji = typeof kanjiTable.$inferInsert;
export type UserProgress = typeof userProgressTable.$inferSelect;
export type NewUserProgress = typeof userProgressTable.$inferInsert;

// Export all tables and relations for proper query building
export const tables = {
  kanji: kanjiTable,
  userProgress: userProgressTable,
};

export const tableRelations = {
  kanjiRelations,
  userProgressRelations,
};
