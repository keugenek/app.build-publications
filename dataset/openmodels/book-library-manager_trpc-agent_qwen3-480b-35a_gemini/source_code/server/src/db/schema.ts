import { serial, text, pgTable, timestamp } from 'drizzle-orm/pg-core';

// Books table schema
export const booksTable = pgTable('books', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  author: text('author').notNull(),
  genre: text('genre'), // Nullable by default
  status: text('status').notNull(), // Will store enum values as strings
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// TypeScript types for the table schema
export type Book = typeof booksTable.$inferSelect; // For SELECT operations
export type NewBook = typeof booksTable.$inferInsert; // For INSERT operations

// Export all tables for relation queries
export const tables = { books: booksTable };
