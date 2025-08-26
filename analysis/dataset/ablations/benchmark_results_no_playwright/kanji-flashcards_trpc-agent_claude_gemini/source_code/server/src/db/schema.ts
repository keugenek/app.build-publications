import { serial, text, pgTable, timestamp, integer, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enum definitions for PostgreSQL
export const jlptLevelEnum = pgEnum('jlpt_level', ['N5', 'N4', 'N3', 'N2', 'N1']);
export const srsLevelEnum = pgEnum('srs_level', ['APPRENTICE_1', 'APPRENTICE_2', 'APPRENTICE_3', 'APPRENTICE_4', 'GURU_1', 'GURU_2', 'MASTER', 'ENLIGHTENED', 'BURNED']);
export const reviewResultEnum = pgEnum('review_result', ['CORRECT', 'INCORRECT']);

// Users table
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  username: text('username').notNull().unique(),
  password_hash: text('password_hash').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Kanji table
export const kanjiTable = pgTable('kanji', {
  id: serial('id').primaryKey(),
  character: text('character').notNull().unique(),
  meaning_english: text('meaning_english').notNull(),
  reading_hiragana: text('reading_hiragana').notNull(),
  reading_katakana: text('reading_katakana'), // Nullable - some kanji don't have katakana readings
  jlpt_level: jlptLevelEnum('jlpt_level').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// User progress table - tracks SRS state for each user-kanji pair
export const userProgressTable = pgTable('user_progress', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull().references(() => usersTable.id),
  kanji_id: integer('kanji_id').notNull().references(() => kanjiTable.id),
  srs_level: srsLevelEnum('srs_level').notNull().default('APPRENTICE_1'),
  next_review_at: timestamp('next_review_at').notNull(),
  correct_streak: integer('correct_streak').notNull().default(0),
  total_reviews: integer('total_reviews').notNull().default(0),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Review history table - tracks all review attempts
export const reviewHistoryTable = pgTable('review_history', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull().references(() => usersTable.id),
  kanji_id: integer('kanji_id').notNull().references(() => kanjiTable.id),
  result: reviewResultEnum('result').notNull(),
  previous_srs_level: srsLevelEnum('previous_srs_level').notNull(),
  new_srs_level: srsLevelEnum('new_srs_level').notNull(),
  review_time_ms: integer('review_time_ms').notNull(), // Time taken to answer in milliseconds
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Relations definitions
export const usersRelations = relations(usersTable, ({ many }) => ({
  progress: many(userProgressTable),
  reviews: many(reviewHistoryTable),
}));

export const kanjiRelations = relations(kanjiTable, ({ many }) => ({
  progress: many(userProgressTable),
  reviews: many(reviewHistoryTable),
}));

export const userProgressRelations = relations(userProgressTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [userProgressTable.user_id],
    references: [usersTable.id],
  }),
  kanji: one(kanjiTable, {
    fields: [userProgressTable.kanji_id],
    references: [kanjiTable.id],
  }),
}));

export const reviewHistoryRelations = relations(reviewHistoryTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [reviewHistoryTable.user_id],
    references: [usersTable.id],
  }),
  kanji: one(kanjiTable, {
    fields: [reviewHistoryTable.kanji_id],
    references: [kanjiTable.id],
  }),
}));

// TypeScript types for the table schemas
export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;

export type Kanji = typeof kanjiTable.$inferSelect;
export type NewKanji = typeof kanjiTable.$inferInsert;

export type UserProgress = typeof userProgressTable.$inferSelect;
export type NewUserProgress = typeof userProgressTable.$inferInsert;

export type ReviewHistory = typeof reviewHistoryTable.$inferSelect;
export type NewReviewHistory = typeof reviewHistoryTable.$inferInsert;

// Export all tables for proper query building
export const tables = {
  users: usersTable,
  kanji: kanjiTable,
  userProgress: userProgressTable,
  reviewHistory: reviewHistoryTable,
};
