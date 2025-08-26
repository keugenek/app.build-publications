import { serial, text, pgTable, timestamp } from 'drizzle-orm/pg-core';

export const plantsTable = pgTable('plants', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  last_watered: timestamp('last_watered').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// TypeScript type for the table schema
export type Plant = typeof plantsTable.$inferSelect; // For SELECT operations
export type NewPlant = typeof plantsTable.$inferInsert; // For INSERT operations

// Important: Export all tables for proper query building
export const tables = { plants: plantsTable };
