import { serial, integer, pgTable, timestamp } from 'drizzle-orm/pg-core';

export const beerCountsTable = pgTable('beer_counts', {
  id: serial('id').primaryKey(),
  count: integer('count').notNull().default(0), // Default count starts at 0
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// TypeScript type for the table schema
export type BeerCount = typeof beerCountsTable.$inferSelect; // For SELECT operations
export type NewBeerCount = typeof beerCountsTable.$inferInsert; // For INSERT operations

// Important: Export all tables for proper query building
export const tables = { beerCounts: beerCountsTable };
