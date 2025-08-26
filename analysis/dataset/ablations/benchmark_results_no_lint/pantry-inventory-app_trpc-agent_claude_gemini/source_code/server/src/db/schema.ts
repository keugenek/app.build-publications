import { serial, text, pgTable, timestamp, numeric, integer, date } from 'drizzle-orm/pg-core';

export const pantryItemsTable = pgTable('pantry_items', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  quantity: numeric('quantity', { precision: 10, scale: 2 }).notNull(), // Use numeric for precise quantities
  unit: text('unit').notNull(), // e.g., "cups", "pieces", "lbs", "oz"
  expiration_date: date('expiration_date').notNull(), // Use date type for expiration dates
  category: text('category'), // Nullable by default - e.g., "dairy", "vegetables", "meat"
  notes: text('notes'), // Nullable by default - optional notes about the item
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

export const recipesTable = pgTable('recipes', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'), // Nullable by default
  ingredients: text('ingredients').array().notNull(), // PostgreSQL array of ingredient names
  instructions: text('instructions'), // Nullable by default
  prep_time_minutes: integer('prep_time_minutes'), // Nullable by default
  cook_time_minutes: integer('cook_time_minutes'), // Nullable by default
  servings: integer('servings'), // Nullable by default
  created_at: timestamp('created_at').defaultNow().notNull()
});

// TypeScript types for the table schemas
export type PantryItem = typeof pantryItemsTable.$inferSelect; // For SELECT operations
export type NewPantryItem = typeof pantryItemsTable.$inferInsert; // For INSERT operations

export type Recipe = typeof recipesTable.$inferSelect; // For SELECT operations
export type NewRecipe = typeof recipesTable.$inferInsert; // For INSERT operations

// Important: Export all tables for proper query building
export const tables = { 
  pantryItems: pantryItemsTable,
  recipes: recipesTable
};
