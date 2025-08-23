import { pgTable, serial, text, varchar, integer, timestamp, boolean } from 'drizzle-orm/pg-core';

// Users table
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password_hash: varchar('password_hash', { length: 255 }).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Kanji table
export const kanjisTable = pgTable('kanjis', {
  id: serial('id').primaryKey(),
  character: varchar('character', { length: 10 }).notNull(),
  meaning: text('meaning').notNull(),
  onyomi: varchar('onyomi', { length: 50 }).notNull(),
  kunyomi: varchar('kunyomi', { length: 50 }).notNull(),
  jlpt_level: integer('jlpt_level').notNull(), // 1 (N1) to 5 (N5)
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Progress/Answers table (stores each review outcome)
export const progressTable = pgTable('progress', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull().references(() => usersTable.id),
  kanji_id: integer('kanji_id').notNull().references(() => kanjisTable.id),
  correct: boolean('correct').notNull(),
  reviewed_at: timestamp('reviewed_at').defaultNow().notNull(),
});

// Export inferred types for SELECT and INSERT operations
export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;

export type Kanji = typeof kanjisTable.$inferSelect;
export type NewKanji = typeof kanjisTable.$inferInsert;

export type Progress = typeof progressTable.$inferSelect;
export type NewProgress = typeof progressTable.$inferInsert;

// Export all tables for relation queries
export const tables = { users: usersTable, kanjis: kanjisTable, progress: progressTable };
