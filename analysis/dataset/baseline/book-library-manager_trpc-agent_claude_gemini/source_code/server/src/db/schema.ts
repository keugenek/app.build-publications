import { serial, text, pgTable, timestamp, integer, pgEnum } from 'drizzle-orm/pg-core';

// Define the reading status enum for PostgreSQL
export const readingStatusEnum = pgEnum('reading_status', ['To Read', 'Reading', 'Finished']);

// Books table definition
export const booksTable = pgTable('books', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  author: text('author').notNull(),
  genre: text('genre').notNull(),
  reading_status: readingStatusEnum('reading_status').notNull().default('To Read'),
  isbn: text('isbn'), // Nullable by default
  pages: integer('pages'), // Nullable by default
  publication_year: integer('publication_year'), // Nullable by default
  notes: text('notes'), // Nullable by default for personal notes
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// TypeScript types for the table schema
export type Book = typeof booksTable.$inferSelect; // For SELECT operations
export type NewBook = typeof booksTable.$inferInsert; // For INSERT operations

// Important: Export all tables for proper query building
export const tables = { books: booksTable };
