import { serial, text, pgTable, timestamp, integer, pgEnum, json } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Recipe category enum
export const recipeCategoryEnum = pgEnum('recipe_category', [
  'appetizer',
  'main_course',
  'dessert',
  'beverage',
  'breakfast',
  'lunch',
  'dinner',
  'snack',
  'salad',
  'soup',
  'vegetarian',
  'vegan',
  'gluten_free'
]);

// Users table
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  password_hash: text('password_hash').notNull(),
  name: text('name').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Recipes table
export const recipesTable = pgTable('recipes', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'), // Nullable by default
  ingredients: json('ingredients').$type<string[]>().notNull(), // Array of ingredient strings
  instructions: json('instructions').$type<string[]>().notNull(), // Array of instruction strings
  prep_time_minutes: integer('prep_time_minutes'), // Nullable
  cook_time_minutes: integer('cook_time_minutes'), // Nullable
  servings: integer('servings'), // Nullable
  category: recipeCategoryEnum('category').notNull(),
  user_id: integer('user_id').references(() => usersTable.id).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Favorite recipes table (junction table)
export const favoriteRecipesTable = pgTable('favorite_recipes', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').references(() => usersTable.id).notNull(),
  recipe_id: integer('recipe_id').references(() => recipesTable.id).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Define relations
export const usersRelations = relations(usersTable, ({ many }) => ({
  recipes: many(recipesTable),
  favoriteRecipes: many(favoriteRecipesTable),
}));

export const recipesRelations = relations(recipesTable, ({ one, many }) => ({
  user: one(usersTable, {
    fields: [recipesTable.user_id],
    references: [usersTable.id],
  }),
  favorites: many(favoriteRecipesTable),
}));

export const favoriteRecipesRelations = relations(favoriteRecipesTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [favoriteRecipesTable.user_id],
    references: [usersTable.id],
  }),
  recipe: one(recipesTable, {
    fields: [favoriteRecipesTable.recipe_id],
    references: [recipesTable.id],
  }),
}));

// TypeScript types for the table schemas
export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;
export type Recipe = typeof recipesTable.$inferSelect;
export type NewRecipe = typeof recipesTable.$inferInsert;
export type FavoriteRecipe = typeof favoriteRecipesTable.$inferSelect;
export type NewFavoriteRecipe = typeof favoriteRecipesTable.$inferInsert;

// Export all tables and relations for proper query building
export const tables = {
  users: usersTable,
  recipes: recipesTable,
  favoriteRecipes: favoriteRecipesTable
};
