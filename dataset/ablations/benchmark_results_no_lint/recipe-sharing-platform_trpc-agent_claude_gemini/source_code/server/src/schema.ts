import { z } from 'zod';

// User schema
export const userSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  password_hash: z.string(),
  name: z.string(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type User = z.infer<typeof userSchema>;

// Input schema for user registration
export const registerUserInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1)
});

export type RegisterUserInput = z.infer<typeof registerUserInputSchema>;

// Input schema for user login
export const loginInputSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

export type LoginInput = z.infer<typeof loginInputSchema>;

// Recipe category enum
export const recipeCategoryEnum = z.enum([
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

export type RecipeCategory = z.infer<typeof recipeCategoryEnum>;

// Recipe schema
export const recipeSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  ingredients: z.array(z.string()),
  instructions: z.array(z.string()),
  prep_time_minutes: z.number().int().nullable(),
  cook_time_minutes: z.number().int().nullable(),
  servings: z.number().int().nullable(),
  category: recipeCategoryEnum,
  user_id: z.number(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Recipe = z.infer<typeof recipeSchema>;

// Input schema for creating recipes
export const createRecipeInputSchema = z.object({
  title: z.string().min(1),
  description: z.string().nullable(),
  ingredients: z.array(z.string().min(1)).min(1),
  instructions: z.array(z.string().min(1)).min(1),
  prep_time_minutes: z.number().int().positive().nullable(),
  cook_time_minutes: z.number().int().positive().nullable(),
  servings: z.number().int().positive().nullable(),
  category: recipeCategoryEnum,
  user_id: z.number()
});

export type CreateRecipeInput = z.infer<typeof createRecipeInputSchema>;

// Input schema for updating recipes
export const updateRecipeInputSchema = z.object({
  id: z.number(),
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  ingredients: z.array(z.string().min(1)).min(1).optional(),
  instructions: z.array(z.string().min(1)).min(1).optional(),
  prep_time_minutes: z.number().int().positive().nullable().optional(),
  cook_time_minutes: z.number().int().positive().nullable().optional(),
  servings: z.number().int().positive().nullable().optional(),
  category: recipeCategoryEnum.optional(),
  user_id: z.number()
});

export type UpdateRecipeInput = z.infer<typeof updateRecipeInputSchema>;

// Recipe search schema
export const searchRecipesInputSchema = z.object({
  query: z.string().optional(),
  ingredients: z.array(z.string()).optional(),
  categories: z.array(recipeCategoryEnum).optional(),
  user_id: z.number().optional()
});

export type SearchRecipesInput = z.infer<typeof searchRecipesInputSchema>;

// Favorite recipe schema
export const favoriteRecipeSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  recipe_id: z.number(),
  created_at: z.coerce.date()
});

export type FavoriteRecipe = z.infer<typeof favoriteRecipeSchema>;

// Input schema for managing favorites
export const manageFavoriteInputSchema = z.object({
  user_id: z.number(),
  recipe_id: z.number()
});

export type ManageFavoriteInput = z.infer<typeof manageFavoriteInputSchema>;

// Recipe with user information
export const recipeWithUserSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  ingredients: z.array(z.string()),
  instructions: z.array(z.string()),
  prep_time_minutes: z.number().int().nullable(),
  cook_time_minutes: z.number().int().nullable(),
  servings: z.number().int().nullable(),
  category: recipeCategoryEnum,
  user_id: z.number(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
  user_name: z.string(),
  is_favorite: z.boolean().optional()
});

export type RecipeWithUser = z.infer<typeof recipeWithUserSchema>;
