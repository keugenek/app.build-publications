import { 
  serial, 
  text, 
  pgTable, 
  timestamp, 
  integer,
  json,
  varchar,
  primaryKey,
  index
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 50 }).notNull().unique(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Categories table
export const categoriesTable = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  description: text('description'), // Nullable by default
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Recipes table
export const recipesTable = pgTable('recipes', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'), // Nullable by default
  ingredients: json('ingredients').notNull(), // Array of ingredient strings
  instructions: json('instructions').notNull(), // Array of instruction steps
  prep_time_minutes: integer('prep_time_minutes'), // Nullable by default
  cook_time_minutes: integer('cook_time_minutes'), // Nullable by default
  servings: integer('servings'), // Nullable by default
  user_id: integer('user_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  // Index for faster searches
  titleIdx: index('recipe_title_idx').on(table.title),
  userIdx: index('recipe_user_idx').on(table.user_id),
  createdAtIdx: index('recipe_created_at_idx').on(table.created_at),
}));

// Recipe-Category junction table (many-to-many relationship)
export const recipeCategoriesTable = pgTable('recipe_categories', {
  recipe_id: integer('recipe_id').notNull().references(() => recipesTable.id, { onDelete: 'cascade' }),
  category_id: integer('category_id').notNull().references(() => categoriesTable.id, { onDelete: 'cascade' }),
}, (table) => ({
  pk: primaryKey({ columns: [table.recipe_id, table.category_id] }),
}));

// User favorites table (many-to-many relationship)
export const favoriteRecipesTable = pgTable('favorite_recipes', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
  recipe_id: integer('recipe_id').notNull().references(() => recipesTable.id, { onDelete: 'cascade' }),
  created_at: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  // Unique constraint to prevent duplicate favorites
  userRecipeIdx: index('favorite_user_recipe_idx').on(table.user_id, table.recipe_id),
  userIdx: index('favorite_user_idx').on(table.user_id),
}));

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
  recipeCategories: many(recipeCategoriesTable),
  favoriteRecipes: many(favoriteRecipesTable),
}));

export const categoriesRelations = relations(categoriesTable, ({ many }) => ({
  recipeCategories: many(recipeCategoriesTable),
}));

export const recipeCategoriesRelations = relations(recipeCategoriesTable, ({ one }) => ({
  recipe: one(recipesTable, {
    fields: [recipeCategoriesTable.recipe_id],
    references: [recipesTable.id],
  }),
  category: one(categoriesTable, {
    fields: [recipeCategoriesTable.category_id],
    references: [categoriesTable.id],
  }),
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

export type Category = typeof categoriesTable.$inferSelect;
export type NewCategory = typeof categoriesTable.$inferInsert;

export type RecipeCategory = typeof recipeCategoriesTable.$inferSelect;
export type NewRecipeCategory = typeof recipeCategoriesTable.$inferInsert;

export type FavoriteRecipe = typeof favoriteRecipesTable.$inferSelect;
export type NewFavoriteRecipe = typeof favoriteRecipesTable.$inferInsert;

// Export all tables for proper query building
export const tables = { 
  users: usersTable,
  recipes: recipesTable,
  categories: categoriesTable,
  recipeCategories: recipeCategoriesTable,
  favoriteRecipes: favoriteRecipesTable
};
