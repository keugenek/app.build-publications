import { z } from 'zod';

// User schema
export const userSchema = z.object({
  id: z.number(),
  username: z.string(),
  email: z.string().email(),
  created_at: z.coerce.date()
});

export type User = z.infer<typeof userSchema>;

// Recipe schema
export const recipeSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  ingredients: z.array(z.string()), // JSON array of ingredient strings
  instructions: z.array(z.string()), // JSON array of instruction steps
  prep_time_minutes: z.number().int().nullable(),
  cook_time_minutes: z.number().int().nullable(),
  servings: z.number().int().nullable(),
  user_id: z.number(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Recipe = z.infer<typeof recipeSchema>;

// Category schema
export const categorySchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  created_at: z.coerce.date()
});

export type Category = z.infer<typeof categorySchema>;

// Recipe-Category relationship schema
export const recipeCategorySchema = z.object({
  recipe_id: z.number(),
  category_id: z.number()
});

export type RecipeCategory = z.infer<typeof recipeCategorySchema>;

// Favorite recipe schema
export const favoriteRecipeSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  recipe_id: z.number(),
  created_at: z.coerce.date()
});

export type FavoriteRecipe = z.infer<typeof favoriteRecipeSchema>;

// Input schemas for creating/updating

// User input schemas
export const createUserInputSchema = z.object({
  username: z.string().min(1),
  email: z.string().email()
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

// Recipe input schemas
export const createRecipeInputSchema = z.object({
  title: z.string().min(1),
  description: z.string().nullable(),
  ingredients: z.array(z.string().min(1)),
  instructions: z.array(z.string().min(1)),
  prep_time_minutes: z.number().int().positive().nullable(),
  cook_time_minutes: z.number().int().positive().nullable(),
  servings: z.number().int().positive().nullable(),
  user_id: z.number(),
  category_ids: z.array(z.number()).optional() // For associating with categories
});

export type CreateRecipeInput = z.infer<typeof createRecipeInputSchema>;

export const updateRecipeInputSchema = z.object({
  id: z.number(),
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  ingredients: z.array(z.string().min(1)).optional(),
  instructions: z.array(z.string().min(1)).optional(),
  prep_time_minutes: z.number().int().positive().nullable().optional(),
  cook_time_minutes: z.number().int().positive().nullable().optional(),
  servings: z.number().int().positive().nullable().optional(),
  category_ids: z.array(z.number()).optional()
});

export type UpdateRecipeInput = z.infer<typeof updateRecipeInputSchema>;

// Category input schemas
export const createCategoryInputSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable()
});

export type CreateCategoryInput = z.infer<typeof createCategoryInputSchema>;

// Recipe search input schema
export const searchRecipesInputSchema = z.object({
  query: z.string().optional(), // Search in title, description, ingredients
  category_ids: z.array(z.number()).optional(), // Filter by categories
  user_id: z.number().optional(), // Filter by user
  limit: z.number().int().positive().default(20),
  offset: z.number().int().nonnegative().default(0)
});

export type SearchRecipesInput = z.infer<typeof searchRecipesInputSchema>;

// Favorite recipe input schemas
export const addFavoriteInputSchema = z.object({
  user_id: z.number(),
  recipe_id: z.number()
});

export type AddFavoriteInput = z.infer<typeof addFavoriteInputSchema>;

export const removeFavoriteInputSchema = z.object({
  user_id: z.number(),
  recipe_id: z.number()
});

export type RemoveFavoriteInput = z.infer<typeof removeFavoriteInputSchema>;

export const getUserFavoritesInputSchema = z.object({
  user_id: z.number(),
  limit: z.number().int().positive().default(20),
  offset: z.number().int().nonnegative().default(0)
});

export type GetUserFavoritesInput = z.infer<typeof getUserFavoritesInputSchema>;

// Recipe with relations schema (for detailed recipe view)
export const recipeWithDetailsSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  ingredients: z.array(z.string()),
  instructions: z.array(z.string()),
  prep_time_minutes: z.number().int().nullable(),
  cook_time_minutes: z.number().int().nullable(),
  servings: z.number().int().nullable(),
  user_id: z.number(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
  user: userSchema,
  categories: z.array(categorySchema),
  is_favorite: z.boolean().optional() // If viewing user has this as favorite
});

export type RecipeWithDetails = z.infer<typeof recipeWithDetailsSchema>;
