import { serial, text, timestamp, integer, pgTable } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// cards table stores birthday card data.
export const cardsTable = pgTable('cards', {
  id: serial('id').primaryKey(),
  message: text('message').notNull(),
  // Store photos as a JSON array of strings. Use text column with JSON validation in app.
  photos: text('photos').notNull().default(sql`'[]'`),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Export inferred types for SELECT and INSERT operations.
export type Card = typeof cardsTable.$inferSelect;
export type NewCard = typeof cardsTable.$inferInsert;

// Export all tables for relation queries.
export const tables = { cards: cardsTable };
