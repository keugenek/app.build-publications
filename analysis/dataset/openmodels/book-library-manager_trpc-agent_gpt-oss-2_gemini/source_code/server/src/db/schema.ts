import { pgTable, serial, text, pgEnum, timestamp } from 'drizzle-orm/pg-core';
import { type InferModel } from 'drizzle-orm';

// Define enum for reading status in DB
export const readingStatusEnum = pgEnum('reading_status', ['To Read', 'Reading', 'Read'] as const);

export const booksTable = pgTable('books', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  author: text('author').notNull(),
  genre: text('genre').notNull(),
  reading_status: readingStatusEnum('reading_status').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Types for select and insert
export type Book = InferModel<typeof booksTable>;
export type NewBook = InferModel<typeof booksTable, 'insert'>;

export const tables = { books: booksTable };
