import { serial, integer, pgTable, timestamp } from 'drizzle-orm/pg-core';

export const beerCountTable = pgTable('beer_count', {
  id: serial('id').primaryKey(),
  count: integer('count').notNull().default(0), // Beer count, defaults to 0
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// TypeScript type for the table schema
export type BeerCount = typeof beerCountTable.$inferSelect; // For SELECT operations
export type NewBeerCount = typeof beerCountTable.$inferInsert; // For INSERT operations

// Important: Export all tables for proper query building
export const tables = { beerCount: beerCountTable };