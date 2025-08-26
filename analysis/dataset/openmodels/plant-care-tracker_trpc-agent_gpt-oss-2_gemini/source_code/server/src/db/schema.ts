import { serial, text, timestamp, pgTable } from 'drizzle-orm/pg-core';

export const plants = pgTable('plants', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  species: text('species').notNull(),
  last_watered: timestamp('last_watered').defaultNow().notNull(),
});

// Types inferred from the table
export type Plant = typeof plants.$inferSelect; // For SELECT queries
export type NewPlant = typeof plants.$inferInsert; // For INSERT queries

// Export all tables for relation queries
export const tables = { plants };
