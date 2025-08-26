import { pgTable, serial, text, jsonb, timestamp } from 'drizzle-orm/pg-core';

export const recipesTable = pgTable('recipes', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  ingredients: jsonb('ingredients').notNull(), // stored as JSON array of strings
  instructions: text('instructions').notNull(),
  categories: jsonb('categories').notNull(), // stored as JSON array of strings
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Types inferred from the table for selects and inserts
export type Recipe = typeof recipesTable.$inferSelect;
export type NewRecipe = typeof recipesTable.$inferInsert;

// Export tables object for relation queries
export const tables = { recipes: recipesTable };
