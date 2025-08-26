import { serial, text, pgTable, timestamp, boolean, integer, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// JLPT levels enum
export const jlptLevelEnum = pgEnum('jlpt_level', ['N5', 'N4', 'N3', 'N2', 'N1']);

// Kanji table
export const kanjiTable = pgTable('kanji', {
  id: serial('id').primaryKey(),
  character: text('character').notNull().unique(),
  meaning: text('meaning').notNull(),
  on_reading: text('on_reading'), // Nullable by default, matches Zod schema
  kun_reading: text('kun_reading'), // Nullable by default, matches Zod schema
  jlpt_level: jlptLevelEnum('jlpt_level').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// User progress table
export const userProgressTable = pgTable('user_progress', {
  id: serial('id').primaryKey(),
  user_id: text('user_id').notNull(),
  kanji_id: integer('kanji_id').notNull().references(() => kanjiTable.id, { onDelete: 'cascade' }),
  is_learned: boolean('is_learned').notNull().default(false),
  review_count: integer('review_count').notNull().default(0),
  last_reviewed: timestamp('last_reviewed'), // Nullable by default
  next_review: timestamp('next_review'), // Nullable by default
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
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
export type Kanji = typeof kanjiTable.$inferSelect; // For SELECT operations
export type NewKanji = typeof kanjiTable.$inferInsert; // For INSERT operations
export type UserProgress = typeof userProgressTable.$inferSelect; // For SELECT operations
export type NewUserProgress = typeof userProgressTable.$inferInsert; // For INSERT operations

// Important: Export all tables and relations for proper query building
export const tables = { 
  kanji: kanjiTable, 
  userProgress: userProgressTable 
};
