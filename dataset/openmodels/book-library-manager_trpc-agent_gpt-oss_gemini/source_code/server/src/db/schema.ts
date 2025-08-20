import { pgTable, serial, text, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { type InferSelectModel, type InferInsertModel } from 'drizzle-orm';

// Enum for reading status
export const readingStatusEnum = pgEnum('reading_status', [
  'to_read',
  'currently_reading',
  'finished',
]);

export const booksTable = pgTable('books', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  author: text('author').notNull(),
  genre: text('genre').notNull(),
  reading_status: readingStatusEnum('reading_status').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Types for SELECT and INSERT operations
export type Book = InferSelectModel<typeof booksTable>;
export type NewBook = InferInsertModel<typeof booksTable>;

// Export tables for relation queries
export const tables = { books: booksTable };
