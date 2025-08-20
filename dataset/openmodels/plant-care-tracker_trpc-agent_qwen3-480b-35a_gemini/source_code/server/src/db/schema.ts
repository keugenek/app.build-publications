import { serial, text, pgTable, timestamp } from 'drizzle-orm/pg-core';

export const plantsTable = pgTable('plants', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  lastWateredDate: timestamp('last_watered_date').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// TypeScript types for the table schema
export type Plant = typeof plantsTable.$inferSelect; // For SELECT operations
export type NewPlant = typeof plantsTable.$inferInsert; // For INSERT operations

// Important: Export all tables and relations for proper query building
export const tables = { plants: plantsTable };
