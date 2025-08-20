import { serial, integer, pgTable, timestamp } from 'drizzle-orm/pg-core';

export const beerCountsTable = pgTable('beer_counts', {
  id: serial('id').primaryKey(),
  count: integer('count').notNull().default(0),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Types for SELECT and INSERT
export type BeerCount = typeof beerCountsTable.$inferSelect;
export type NewBeerCount = typeof beerCountsTable.$inferInsert;

export const tables = { beerCounts: beerCountsTable };
