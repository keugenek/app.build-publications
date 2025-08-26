import { serial, text, pgTable, timestamp, integer, date, pgEnum as createPgEnum } from 'drizzle-orm/pg-core';

// Define category enum for database
export const categoryEnum = createPgEnum('category', ['Dairy', 'Produce', 'Canned Goods', 'Grains', 'Condiments', 'Beverages', 'Snacks', 'Other']);

export const pantryItemsTable = pgTable('pantry_items', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  quantity: integer('quantity').notNull(),
  expiry_date: date('expiry_date').notNull(),
  category: categoryEnum('category').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// TypeScript types for the table schema
export type PantryItem = typeof pantryItemsTable.$inferSelect; // For SELECT operations
export type NewPantryItem = typeof pantryItemsTable.$inferInsert; // For INSERT operations

// Export all tables and relations for proper query building
export const tables = { pantryItems: pantryItemsTable };
