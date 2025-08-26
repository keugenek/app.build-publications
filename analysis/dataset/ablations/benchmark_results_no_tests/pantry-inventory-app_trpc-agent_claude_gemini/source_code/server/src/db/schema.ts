import { serial, text, pgTable, timestamp, real, date } from 'drizzle-orm/pg-core';

export const pantryItemsTable = pgTable('pantry_items', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  quantity: real('quantity').notNull(), // Use real for decimal quantities
  expiry_date: date('expiry_date').notNull(), // Store as date only
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// TypeScript types for the table schema
export type PantryItem = typeof pantryItemsTable.$inferSelect; // For SELECT operations
export type NewPantryItem = typeof pantryItemsTable.$inferInsert; // For INSERT operations

// Important: Export all tables for proper query building
export const tables = { pantryItems: pantryItemsTable };
