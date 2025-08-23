import { serial, text, pgTable, timestamp } from 'drizzle-orm/pg-core';

export const booksTable = pgTable('books', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  author: text('author').notNull(),
  genre: text('genre').notNull(),
  status: text('status', { enum: ['Read', 'Unread', 'Reading'] }).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// TypeScript types for the table schema
export type Book = typeof booksTable.$inferSelect; // For SELECT operations
export type NewBook = typeof booksTable.$inferInsert; // For INSERT operations

// Export all tables for relation queries
export const tables = { books: booksTable };
