import { pgTable, serial, text, timestamp, pgEnum } from 'drizzle-orm/pg-core';

// Enum definition matching Zod readingStatusEnum
export const readingStatusEnum = pgEnum('reading_status', ['To Read', 'Reading', 'Finished'] as const);

export const booksTable = pgTable('books', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  author: text('author').notNull(),
  genre: text('genre').notNull(),
  reading_status: readingStatusEnum('reading_status').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Export types for SELECT and INSERT
export type Book = typeof booksTable.$inferSelect;
export type NewBook = typeof booksTable.$inferInsert;

// Export tables for relation queries
export const tables = {
  books: booksTable,
};
