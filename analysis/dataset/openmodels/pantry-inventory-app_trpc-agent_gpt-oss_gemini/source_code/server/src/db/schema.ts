import { pgEnum, pgTable, serial, text, numeric, date, timestamp } from 'drizzle-orm/pg-core';

// Enums matching Zod enums
export const unitEnum = pgEnum('unit', [
  'g',
  'kg',
  'lb',
  'oz',
  'ml',
  'l',
  'pcs',
]);

export const categoryEnum = pgEnum('category', [
  'Produce',
  'Dairy',
  'Meat',
  'Grains',
  'Spices',
  'Other',
]);

export const pantryItemsTable = pgTable('pantry_items', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  quantity: numeric('quantity', { precision: 12, scale: 4 }).notNull(), // stored as numeric for precision
  unit: unitEnum('unit').notNull(),
  purchase_date: date('purchase_date').notNull(),
  expiry_date: date('expiry_date').notNull(),
  category: categoryEnum('category').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Types for select/insert operations
export type PantryItem = typeof pantryItemsTable.$inferSelect;
export type NewPantryItem = typeof pantryItemsTable.$inferInsert;

// Export all tables for relation queries
export const tables = {
  pantry_items: pantryItemsTable,
};
