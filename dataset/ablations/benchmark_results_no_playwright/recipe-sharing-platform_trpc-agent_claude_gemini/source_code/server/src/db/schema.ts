import { serial, text, pgTable, timestamp, integer, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Recipe categories enum
export const recipeCategoryEnum = pgEnum('recipe_category', [
  'Breakfast',
  'Lunch', 
  'Dinner',
  'Dessert',
  'Appetizer',
  'Main Course',
  'Vegetarian',
  'Vegan',
  'Gluten-Free'
]);

// Users table
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  email: text('email').notNull().unique(),
  password_hash: text('password_hash').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Recipes table
export const recipesTable = pgTable('recipes', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  instructions: text('instructions').notNull(),
  author_id: integer('author_id').notNull().references(() => usersTable.id),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Ingredients table
export const ingredientsTable = pgTable('ingredients', {
  id: serial('id').primaryKey(),
  recipe_id: integer('recipe_id').notNull().references(() => recipesTable.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  quantity: text('quantity').notNull(),
  unit: text('unit'), // Nullable by default
});

// Recipe categories junction table
export const recipeCategoriesTable = pgTable('recipe_categories', {
  id: serial('id').primaryKey(),
  recipe_id: integer('recipe_id').notNull().references(() => recipesTable.id, { onDelete: 'cascade' }),
  category: recipeCategoryEnum('category').notNull(),
});

// User favorites table
export const userFavoritesTable = pgTable('user_favorites', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
  recipe_id: integer('recipe_id').notNull().references(() => recipesTable.id, { onDelete: 'cascade' }),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(usersTable, ({ many }) => ({
  recipes: many(recipesTable),
  favorites: many(userFavoritesTable),
}));

export const recipesRelations = relations(recipesTable, ({ one, many }) => ({
  author: one(usersTable, {
    fields: [recipesTable.author_id],
    references: [usersTable.id],
  }),
  ingredients: many(ingredientsTable),
  categories: many(recipeCategoriesTable),
  favorites: many(userFavoritesTable),
}));

export const ingredientsRelations = relations(ingredientsTable, ({ one }) => ({
  recipe: one(recipesTable, {
    fields: [ingredientsTable.recipe_id],
    references: [recipesTable.id],
  }),
}));

export const recipeCategoriesRelations = relations(recipeCategoriesTable, ({ one }) => ({
  recipe: one(recipesTable, {
    fields: [recipeCategoriesTable.recipe_id],
    references: [recipesTable.id],
  }),
}));

export const userFavoritesRelations = relations(userFavoritesTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [userFavoritesTable.user_id],
    references: [usersTable.id],
  }),
  recipe: one(recipesTable, {
    fields: [userFavoritesTable.recipe_id],
    references: [recipesTable.id],
  }),
}));

// TypeScript types for the table schemas
export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;

export type Recipe = typeof recipesTable.$inferSelect;
export type NewRecipe = typeof recipesTable.$inferInsert;

export type Ingredient = typeof ingredientsTable.$inferSelect;
export type NewIngredient = typeof ingredientsTable.$inferInsert;

export type RecipeCategory = typeof recipeCategoriesTable.$inferSelect;
export type NewRecipeCategory = typeof recipeCategoriesTable.$inferInsert;

export type UserFavorite = typeof userFavoritesTable.$inferSelect;
export type NewUserFavorite = typeof userFavoritesTable.$inferInsert;

// Export all tables for relation queries
export const tables = {
  users: usersTable,
  recipes: recipesTable,
  ingredients: ingredientsTable,
  recipeCategories: recipeCategoriesTable,
  userFavorites: userFavoritesTable,
};
