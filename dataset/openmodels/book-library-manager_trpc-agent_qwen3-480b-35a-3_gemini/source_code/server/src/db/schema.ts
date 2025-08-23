import { serial, text, pgTable, timestamp } from 'drizzle-orm/pg-core';

export const booksTable = pgTable('books', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  author: text('author').notNull(),
  genre: text('genre').notNull(),
  status: text('status', { enum: ['to-read', 'reading', 'completed'] }).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// TypeScript type for the table schema
export type Book = typeof booksTable.$inferSelect; // For SELECT operations
export type NewBook = typeof booksTable.$inferInsert; // For INSERT operations

// Important: Export all tables and relations for proper query building
export const tables = { books: booksTable };
