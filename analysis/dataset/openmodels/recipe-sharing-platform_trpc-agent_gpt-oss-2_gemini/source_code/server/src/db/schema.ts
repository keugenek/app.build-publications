import { pgTable, serial, text, timestamp, jsonb } from 'drizzle-orm/pg-core';

export const recipesTable = pgTable('recipes', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'), // nullable by default
  ingredients: jsonb('ingredients').notNull(), // store array of strings
  instructions: text('instructions').notNull(),
  categories: jsonb('categories').notNull(), // store array of strings
  image_url: text('image_url'), // nullable
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Types for select and insert operations
export type Recipe = typeof recipesTable.$inferSelect;
export type NewRecipe = typeof recipesTable.$inferInsert;

export const tables = { recipes: recipesTable };
