import { serial, text, pgTable, timestamp, integer, json, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Recipe categories enum
export const recipeCategoryEnum = pgEnum('recipe_category', [
  'breakfast',
  'lunch', 
  'dinner',
  'appetizer',
  'dessert',
  'snack',
  'beverage',
  'salad',
  'soup',
  'main_course',
  'side_dish',
  'vegetarian',
  'vegan',
  'gluten_free',
  'low_carb',
  'keto',
  'healthy',
  'comfort_food',
  'international'
]);

// Recipe difficulty enum
export const recipeDifficultyEnum = pgEnum('recipe_difficulty', ['easy', 'medium', 'hard']);

// Users table
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  email: text('email').notNull().unique(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Recipes table
export const recipesTable = pgTable('recipes', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'), // Nullable
  ingredients: json('ingredients').notNull(), // JSON array of strings
  instructions: json('instructions').notNull(), // JSON array of strings
  categories: json('categories').notNull(), // JSON array of category enums
  prep_time_minutes: integer('prep_time_minutes'), // Nullable
  cook_time_minutes: integer('cook_time_minutes'), // Nullable
  servings: integer('servings'), // Nullable
  difficulty: recipeDifficultyEnum('difficulty'), // Nullable
  author_id: integer('author_id').notNull().references(() => usersTable.id),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Saved recipes table (many-to-many relationship between users and recipes)
export const savedRecipesTable = pgTable('saved_recipes', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull().references(() => usersTable.id),
  recipe_id: integer('recipe_id').notNull().references(() => recipesTable.id),
  saved_at: timestamp('saved_at').defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(usersTable, ({ many }) => ({
  recipes: many(recipesTable),
  savedRecipes: many(savedRecipesTable),
}));

export const recipesRelations = relations(recipesTable, ({ one, many }) => ({
  author: one(usersTable, {
    fields: [recipesTable.author_id],
    references: [usersTable.id],
  }),
  savedByUsers: many(savedRecipesTable),
}));

export const savedRecipesRelations = relations(savedRecipesTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [savedRecipesTable.user_id],
    references: [usersTable.id],
  }),
  recipe: one(recipesTable, {
    fields: [savedRecipesTable.recipe_id],
    references: [recipesTable.id],
  }),
}));

// TypeScript types for the table schemas
export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;

export type Recipe = typeof recipesTable.$inferSelect;
export type NewRecipe = typeof recipesTable.$inferInsert;

export type SavedRecipe = typeof savedRecipesTable.$inferSelect;
export type NewSavedRecipe = typeof savedRecipesTable.$inferInsert;

// Important: Export all tables and relations for proper query building
export const tables = {
  users: usersTable,
  recipes: recipesTable,
  savedRecipes: savedRecipesTable
};
