import { serial, text, pgTable, timestamp, date } from 'drizzle-orm/pg-core';

export const plantsTable = pgTable('plants', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  lastWateredDate: date('last_watered_date').notNull(),
  lightLevel: text('light_level', { enum: ['low', 'medium', 'high'] }).notNull(),
  humidity: text('humidity', { enum: ['low', 'medium', 'high'] }).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// TypeScript type for the table schema
export type Plant = typeof plantsTable.$inferSelect; // For SELECT operations
export type NewPlant = typeof plantsTable.$inferInsert; // For INSERT operations

// Important: Export all tables and relations for proper query building
export const tables = { plants: plantsTable };
