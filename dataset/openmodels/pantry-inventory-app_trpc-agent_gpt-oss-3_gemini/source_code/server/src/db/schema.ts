import { pgEnum, serial, text, numeric, timestamp, pgTable } from 'drizzle-orm/pg-core';

// Define enum for unit types, matching Zod enum
export const unitEnum = pgEnum('unit', ['grams', 'pieces', 'liters'] as const);

export const pantryItemsTable = pgTable('pantry_items', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  quantity: numeric('quantity', { precision: 12, scale: 2 }).notNull(), // Stored as numeric, will be parsed as string by DB driver
  unit: unitEnum('unit').notNull(),
  expiry_date: timestamp('expiry_date').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Types for selects and inserts
export type PantryItem = typeof pantryItemsTable.$inferSelect;
export type NewPantryItem = typeof pantryItemsTable.$inferInsert;

// Export tables for relation queries
export const tables = {
  pantryItems: pantryItemsTable,
};
