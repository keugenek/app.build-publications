import { serial, varchar, timestamp, pgTable } from 'drizzle-orm/pg-core';
import { pgEnum as pgEnum0 } from 'drizzle-orm/pg-core';

// Export the light exposure enum for use in the app
export const lightExposureEnum = pgEnum0('light_exposure', ['low', 'medium', 'high']);

export const plantsTable = pgTable('plants', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  species: varchar('species', { length: 100 }).notNull(),
  lastWatered: timestamp('last_watered').notNull(),
  lightExposure: lightExposureEnum('light_exposure').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// TypeScript types for the table schema
export type Plant = typeof plantsTable.$inferSelect;
export type NewPlant = typeof plantsTable.$inferInsert;

// Important: Export all tables and relations for proper query building
export const tables = { plants: plantsTable };
