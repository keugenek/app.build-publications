import { serial, text, pgTable, timestamp, integer, numeric, primaryKey, varchar } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  password_hash: varchar('password_hash', { length: 255 }).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const usersRelations = relations(usersTable, ({ many }) => ({
  recipes: many(recipesTable),
  favoriteRecipes: many(userFavoriteRecipesTable),
}));

// Recipes table
export const recipesTable = pgTable('recipes', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull().references(() => usersTable.id),
  name: varchar('name', { length: 255 }).notNull(),
  instructions: text('instructions').notNull(),
  preparation_time: integer('preparation_time').notNull(),
  cooking_time: integer('cooking_time').notNull(),
  serving_size: integer('serving_size').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const recipesRelations = relations(recipesTable, ({ one, many }) => ({
  user: one(usersTable, {
    fields: [recipesTable.user_id],
    references: [usersTable.id],
  }),
  ingredients: many(recipeIngredientsTable),
  categories: many(recipeCategoriesTable),
  favoritedBy: many(userFavoriteRecipesTable),
}));

// Recipe ingredients table
export const recipeIngredientsTable = pgTable('recipe_ingredients', {
  id: serial('id').primaryKey(),
  recipe_id: integer('recipe_id').notNull().references(() => recipesTable.id),
  ingredient: varchar('ingredient', { length: 255 }).notNull(),
});

export const recipeIngredientsRelations = relations(recipeIngredientsTable, ({ one }) => ({
  recipe: one(recipesTable, {
    fields: [recipeIngredientsTable.recipe_id],
    references: [recipesTable.id],
  }),
}));

// Recipe categories table
export const recipeCategoriesTable = pgTable('recipe_categories', {
  id: serial('id').primaryKey(),
  recipe_id: integer('recipe_id').notNull().references(() => recipesTable.id),
  category: varchar('category', { length: 100 }).notNull(),
});

export const recipeCategoriesRelations = relations(recipeCategoriesTable, ({ one }) => ({
  recipe: one(recipesTable, {
    fields: [recipeCategoriesTable.recipe_id],
    references: [recipesTable.id],
  }),
}));

// User favorite recipes table
export const userFavoriteRecipesTable = pgTable('user_favorite_recipes', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull().references(() => usersTable.id),
  recipe_id: integer('recipe_id').notNull().references(() => recipesTable.id),
  created_at: timestamp('created_at').defaultNow().notNull(),
}, (table) => {
  return {
    userRecipeIdx: primaryKey({ columns: [table.user_id, table.recipe_id] }),
  };
});

export const userFavoriteRecipesRelations = relations(userFavoriteRecipesTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [userFavoriteRecipesTable.user_id],
    references: [usersTable.id],
  }),
  recipe: one(recipesTable, {
    fields: [userFavoriteRecipesTable.recipe_id],
    references: [recipesTable.id],
  }),
}));

// TypeScript types for the table schemas
export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;

export type Recipe = typeof recipesTable.$inferSelect;
export type NewRecipe = typeof recipesTable.$inferInsert;

export type RecipeIngredient = typeof recipeIngredientsTable.$inferSelect;
export type NewRecipeIngredient = typeof recipeIngredientsTable.$inferInsert;

export type RecipeCategory = typeof recipeCategoriesTable.$inferSelect;
export type NewRecipeCategory = typeof recipeCategoriesTable.$inferInsert;

export type UserFavoriteRecipe = typeof userFavoriteRecipesTable.$inferSelect;
export type NewUserFavoriteRecipe = typeof userFavoriteRecipesTable.$inferInsert;

// Export all tables and relations for proper query building
export const tables = { 
  users: usersTable, 
  recipes: recipesTable, 
  recipeIngredients: recipeIngredientsTable,
  recipeCategories: recipeCategoriesTable,
  userFavoriteRecipes: userFavoriteRecipesTable,
};
