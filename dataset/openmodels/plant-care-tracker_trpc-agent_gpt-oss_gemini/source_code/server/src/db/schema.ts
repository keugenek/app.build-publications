import { pgTable, serial, text, timestamp, date, integer } from 'drizzle-orm/pg-core';

export const plantsTable = pgTable('plants', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  species: text('species').notNull(),
  last_watered_at: timestamp('last_watered_at').defaultNow().notNull(),
  created_at: timestamp('created_at').defaultNow().notNull()
});

// Types for select and insert
export type Plant = typeof plantsTable.$inferSelect;
export type NewPlant = typeof plantsTable.$inferInsert;

export const tables = { plants: plantsTable };
