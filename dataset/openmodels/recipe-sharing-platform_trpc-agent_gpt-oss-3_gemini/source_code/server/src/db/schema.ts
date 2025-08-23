import { pgTable, serial, text, timestamp, integer, pgEnum } from 'drizzle-orm/pg-core';

// Users table
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  password_hash: text('password_hash').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Recipes table
export const recipesTable = pgTable('recipes', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  ingredients: text('ingredients').array().notNull(), // array of strings
  instructions: text('instructions').notNull(),
  categories: text('categories').array(), // nullable array (can be null)
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Favorites table (many-to-many between users and recipes)
export const favoritesTable = pgTable('favorites', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull().references(() => usersTable.id),
  recipe_id: integer('recipe_id').notNull().references(() => recipesTable.id),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Export tables for relation queries
export const tables = {
  users: usersTable,
  recipes: recipesTable,
  favorites: favoritesTable,
};

// Types for SELECT and INSERT operations
export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;

export type Recipe = typeof recipesTable.$inferSelect;
export type NewRecipe = typeof recipesTable.$inferInsert;

export type Favorite = typeof favoritesTable.$inferSelect;
export type NewFavorite = typeof favoritesTable.$inferInsert;
