import { pgTable, serial, text, timestamp, integer } from 'drizzle-orm/pg-core';

export const plantsTable = pgTable('plants', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull(),
  last_watered: timestamp('last_watered').defaultNow().notNull(),
});

// Types for select and insert
export type Plant = typeof plantsTable.$inferSelect;
export type NewPlant = typeof plantsTable.$inferInsert;

export const tables = { plants: plantsTable };
