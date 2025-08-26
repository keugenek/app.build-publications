import { serial, text, pgTable, timestamp, pgEnum } from 'drizzle-orm/pg-core';

// Define sunlight exposure enum for PostgreSQL
export const sunlightExposureEnum = pgEnum('sunlight_exposure', ['Low', 'Medium', 'High']);

// Plants table
export const plantsTable = pgTable('plants', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  last_watered: timestamp('last_watered').notNull(),
  sunlight_exposure: sunlightExposureEnum('sunlight_exposure').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// TypeScript types for the table schema
export type Plant = typeof plantsTable.$inferSelect; // For SELECT operations
export type NewPlant = typeof plantsTable.$inferInsert; // For INSERT operations

// Important: Export all tables for proper query building
export const tables = { plants: plantsTable };
