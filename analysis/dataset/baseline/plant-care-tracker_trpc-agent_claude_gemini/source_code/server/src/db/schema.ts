import { serial, text, pgTable, timestamp, pgEnum } from 'drizzle-orm/pg-core';

// Define light exposure enum for PostgreSQL
export const lightExposureEnum = pgEnum('light_exposure', ['low', 'medium', 'high']);

export const plantsTable = pgTable('plants', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull(),
  last_watered_date: timestamp('last_watered_date').notNull(),
  light_exposure: lightExposureEnum('light_exposure').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// TypeScript types for the table schema
export type Plant = typeof plantsTable.$inferSelect; // For SELECT operations
export type NewPlant = typeof plantsTable.$inferInsert; // For INSERT operations

// Important: Export all tables for proper query building
export const tables = { plants: plantsTable };
