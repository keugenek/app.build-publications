import { pgTable, serial, text, integer, timestamp, pgEnum } from 'drizzle-orm/pg-core';

export const pantryItemsTable = pgTable('pantry_items', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  quantity: integer('quantity').notNull(),
  expiry_date: timestamp('expiry_date').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Types for query results and inserts
export type PantryItem = typeof pantryItemsTable.$inferSelect;
export type NewPantryItem = typeof pantryItemsTable.$inferInsert;

// Export all tables for relation queries
export const tables = {
  pantry_items: pantryItemsTable,
};
