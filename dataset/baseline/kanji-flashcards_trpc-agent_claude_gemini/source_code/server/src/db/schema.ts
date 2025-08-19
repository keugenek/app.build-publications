import { serial, text, pgTable, timestamp, integer, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums for PostgreSQL
export const jlptLevelEnum = pgEnum('jlpt_level', ['N5', 'N4', 'N3', 'N2', 'N1']);
export const srsLevelEnum = pgEnum('srs_level', [
  'APPRENTICE_1',
  'APPRENTICE_2', 
  'APPRENTICE_3',
  'APPRENTICE_4',
  'GURU_1',
  'GURU_2',
  'MASTER',
  'ENLIGHTENED',
  'BURNED'
]);
export const reviewResultEnum = pgEnum('review_result', ['CORRECT', 'INCORRECT']);

// Kanji table - stores all kanji characters and their information
export const kanjiTable = pgTable('kanji', {
  id: serial('id').primaryKey(),
  character: text('character').notNull().unique(), // The actual kanji character
  meaning: text('meaning').notNull(), // English meaning
  kun_reading: text('kun_reading'), // Japanese kun reading (nullable)
  on_reading: text('on_reading'), // Japanese on reading (nullable) 
  jlpt_level: jlptLevelEnum('jlpt_level').notNull(), // JLPT difficulty level
  stroke_count: integer('stroke_count').notNull(), // Number of strokes to write the kanji
  created_at: timestamp('created_at').defaultNow().notNull()
});

// User progress table - tracks each user's progress on individual kanji
export const userProgressTable = pgTable('user_progress', {
  id: serial('id').primaryKey(),
  user_id: text('user_id').notNull(), // Simple string user identifier
  kanji_id: integer('kanji_id').notNull().references(() => kanjiTable.id),
  srs_level: srsLevelEnum('srs_level').notNull().default('APPRENTICE_1'), // Current SRS level
  next_review_at: timestamp('next_review_at').notNull(), // When this kanji should be reviewed next
  correct_streak: integer('correct_streak').notNull().default(0), // Consecutive correct answers
  incorrect_count: integer('incorrect_count').notNull().default(0), // Total incorrect answers
  last_reviewed_at: timestamp('last_reviewed_at'), // When last reviewed (nullable for new items)
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Review sessions table - tracks individual review attempts for analytics
export const reviewSessionsTable = pgTable('review_sessions', {
  id: serial('id').primaryKey(),
  user_id: text('user_id').notNull(),
  kanji_id: integer('kanji_id').notNull().references(() => kanjiTable.id),
  result: reviewResultEnum('result').notNull(), // Whether the answer was correct
  response_time_ms: integer('response_time_ms').notNull(), // Response time in milliseconds
  previous_srs_level: srsLevelEnum('previous_srs_level').notNull(), // SRS level before this review
  new_srs_level: srsLevelEnum('new_srs_level').notNull(), // SRS level after this review
  created_at: timestamp('created_at').defaultNow().notNull()
});

// Relations for better query building
export const kanjiRelations = relations(kanjiTable, ({ many }) => ({
  userProgress: many(userProgressTable),
  reviewSessions: many(reviewSessionsTable)
}));

export const userProgressRelations = relations(userProgressTable, ({ one }) => ({
  kanji: one(kanjiTable, {
    fields: [userProgressTable.kanji_id],
    references: [kanjiTable.id]
  })
}));

export const reviewSessionsRelations = relations(reviewSessionsTable, ({ one }) => ({
  kanji: one(kanjiTable, {
    fields: [reviewSessionsTable.kanji_id],
    references: [kanjiTable.id]
  })
}));

// TypeScript types for database operations
export type Kanji = typeof kanjiTable.$inferSelect;
export type NewKanji = typeof kanjiTable.$inferInsert;

export type UserProgress = typeof userProgressTable.$inferSelect;
export type NewUserProgress = typeof userProgressTable.$inferInsert;

export type ReviewSession = typeof reviewSessionsTable.$inferSelect;
export type NewReviewSession = typeof reviewSessionsTable.$inferInsert;

// Export all tables for relation queries
export const tables = {
  kanji: kanjiTable,
  userProgress: userProgressTable,
  reviewSessions: reviewSessionsTable
};
