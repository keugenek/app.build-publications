import { serial, text, pgTable, timestamp, integer, date } from 'drizzle-orm/pg-core';

export const pantryItemsTable = pgTable('pantry_items', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  quantity: integer('quantity').notNull(),
  expiry_date: date('expiry_date').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// TypeScript type for the table schema
export type PantryItem = typeof pantryItemsTable.$inferSelect; // For SELECT operations
export type NewPantryItem = typeof pantryItemsTable.$inferInsert; // For INSERT operations

// Important: Export all tables and relations for proper query building
export const tables = { pantryItems: pantryItemsTable };
