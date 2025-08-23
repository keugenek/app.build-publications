import { serial, integer, timestamp, pgTable } from 'drizzle-orm/pg-core';

export const beerCounterTable = pgTable('beer_counter', {
  id: serial('id').primaryKey(),
  count: integer('count').notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Types for select and insert
export type BeerCounter = typeof beerCounterTable.$inferSelect;
export type NewBeerCounter = typeof beerCounterTable.$inferInsert;

export const tables = { beerCounter: beerCounterTable };
