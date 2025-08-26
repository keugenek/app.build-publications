import { pgTable, serial, text, integer, numeric, timestamp, pgEnum } from 'drizzle-orm/pg-core';

// JLPT level enum (1-5)
export const jlptLevelEnum = pgEnum('jlpt_level', ['N5','N4','N3','N2','N1']); // using N5..N1 as typical

export const kanjis = pgTable('kanjis', {
  id: serial('id').primaryKey(),
  character: text('character').notNull(),
  meaning: text('meaning').notNull(),
  reading: text('reading').notNull(),
  jlpt_level: integer('jlpt_level').notNull(), // store as integer 1-5
  created_at: timestamp('created_at').defaultNow().notNull()
});

export const progresses = pgTable('progresses', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull(),
  kanji_id: integer('kanji_id').notNull(),
  next_review: timestamp('next_review').notNull(),
  interval_days: integer('interval_days').notNull(),
  easiness_factor: numeric('easiness_factor', { precision: 4, scale: 2 }).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull()
});

// Export types for selects/inserts
export type Kanji = typeof kanjis.$inferSelect;
export type NewKanji = typeof kanjis.$inferInsert;
export type Progress = typeof progresses.$inferSelect;
export type NewProgress = typeof progresses.$inferInsert;

export const tables = { kanjis, progresses };
