import { serial, integer, pgTable, timestamp } from 'drizzle-orm/pg-core';

export const beerCounterTable = pgTable('beer_counter', {
  id: serial('id').primaryKey(),
  count: integer('count').notNull().default(0),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// TypeScript type for the table schema
export type BeerCounter = typeof beerCounterTable.$inferSelect; // For SELECT operations
export type NewBeerCounter = typeof beerCounterTable.$inferInsert; // For INSERT operations

// Important: Export all tables and relations for proper query building
export const tables = { beerCounter: beerCounterTable };
