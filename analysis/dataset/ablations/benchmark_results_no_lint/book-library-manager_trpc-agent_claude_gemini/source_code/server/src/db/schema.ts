import { serial, text, pgTable, timestamp, pgEnum } from 'drizzle-orm/pg-core';

// Reading status enum for the database
export const readingStatusEnum = pgEnum('reading_status', ['To Read', 'Reading', 'Finished']);

export const booksTable = pgTable('books', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  author: text('author').notNull(),
  genre: text('genre').notNull(),
  reading_status: readingStatusEnum('reading_status').notNull().default('To Read'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// TypeScript types for the table schema
export type Book = typeof booksTable.$inferSelect; // For SELECT operations
export type NewBook = typeof booksTable.$inferInsert; // For INSERT operations

// Important: Export all tables for proper query building
export const tables = { books: booksTable };
