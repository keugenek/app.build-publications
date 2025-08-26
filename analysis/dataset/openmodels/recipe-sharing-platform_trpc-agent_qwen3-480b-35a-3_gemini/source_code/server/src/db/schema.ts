import { serial, text, pgTable, timestamp, integer, boolean, pgEnum as createPgEnum } from 'drizzle-orm/pg-core';

// Define the category enum with initial values
export const categoryEnum = createPgEnum('category', ['Breakfast', 'Lunch', 'Dinner', 'Dessert', 'Appetizer']);

// Define the recipes table
export const recipesTable = pgTable('recipes', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  ingredients: text('ingredients').array().notNull(), // Array of ingredients
  instructions: text('instructions').notNull(),
  imageUrl: text('image_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Define the categories table for custom categories
export const categoriesTable = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Define the recipe categories junction table (many-to-many relationship)
export const recipeCategoriesTable = pgTable('recipe_categories', {
  id: serial('id').primaryKey(),
  recipeId: integer('recipe_id').notNull().references(() => recipesTable.id),
  categoryId: integer('category_id').notNull().references(() => categoriesTable.id),
});

// Define the bookmarks table
export const bookmarksTable = pgTable('bookmarks', {
  id: serial('id').primaryKey(),
  recipeId: integer('recipe_id').notNull().references(() => recipesTable.id),
  userId: text('user_id').notNull(), // In a real app, this would reference a users table
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Define the custom categories table (categories created by users)
export const customCategoriesTable = pgTable('custom_categories', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  userId: text('user_id').notNull(), // In a real app, this would reference a users table
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// TypeScript types for the tables
export type Recipe = typeof recipesTable.$inferSelect;
export type NewRecipe = typeof recipesTable.$inferInsert;

export type Category = typeof categoriesTable.$inferSelect;
export type NewCategory = typeof categoriesTable.$inferInsert;

export type RecipeCategory = typeof recipeCategoriesTable.$inferSelect;
export type NewRecipeCategory = typeof recipeCategoriesTable.$inferInsert;

export type Bookmark = typeof bookmarksTable.$inferSelect;
export type NewBookmark = typeof bookmarksTable.$inferInsert;

export type CustomCategory = typeof customCategoriesTable.$inferSelect;
export type NewCustomCategory = typeof customCategoriesTable.$inferInsert;

// Export all tables for relation queries
export const tables = { 
  recipes: recipesTable, 
  categories: categoriesTable, 
  recipeCategories: recipeCategoriesTable, 
  bookmarks: bookmarksTable,
  customCategories: customCategoriesTable
};
