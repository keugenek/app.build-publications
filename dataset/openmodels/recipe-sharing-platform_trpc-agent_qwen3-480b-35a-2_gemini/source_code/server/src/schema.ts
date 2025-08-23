import { z } from 'zod';

// User schema
export const userSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  name: z.string(),
  created_at: z.coerce.date(),
});

export type User = z.infer<typeof userSchema>;

// Recipe schema
export const recipeSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  name: z.string(),
  instructions: z.string(),
  preparation_time: z.number().int().nonnegative(),
  cooking_time: z.number().int().nonnegative(),
  serving_size: z.number().int().positive(),
  created_at: z.coerce.date(),
});

export type Recipe = z.infer<typeof recipeSchema>;

// Recipe ingredient schema
export const recipeIngredientSchema = z.object({
  id: z.number(),
  recipe_id: z.number(),
  ingredient: z.string(),
});

export type RecipeIngredient = z.infer<typeof recipeIngredientSchema>;

// Recipe category schema
export const recipeCategorySchema = z.object({
  id: z.number(),
  recipe_id: z.number(),
  category: z.string(),
});

export type RecipeCategory = z.infer<typeof recipeCategorySchema>;

// User favorite recipe schema
export const userFavoriteRecipeSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  recipe_id: z.number(),
  created_at: z.coerce.date(),
});

export type UserFavoriteRecipe = z.infer<typeof userFavoriteRecipeSchema>;

// Input schema for creating recipes
export const createRecipeInputSchema = z.object({
  name: z.string(),
  ingredients: z.array(z.string()),
  instructions: z.string(),
  categories: z.array(z.string()),
  preparation_time: z.number().int().nonnegative(),
  cooking_time: z.number().int().nonnegative(),
  serving_size: z.number().int().positive(),
});

export type CreateRecipeInput = z.infer<typeof createRecipeInputSchema>;

// Input schema for updating recipes
export const updateRecipeInputSchema = z.object({
  id: z.number(),
  name: z.string().optional(),
  ingredients: z.array(z.string()).optional(),
  instructions: z.string().optional(),
  categories: z.array(z.string()).optional(),
  preparation_time: z.number().int().nonnegative().optional(),
  cooking_time: z.number().int().nonnegative().optional(),
  serving_size: z.number().int().positive().optional(),
});

export type UpdateRecipeInput = z.infer<typeof updateRecipeInputSchema>;

// Input schema for user registration
export const registerUserInputSchema = z.object({
  email: z.string().email(),
  name: z.string(),
  password: z.string().min(6),
});

export type RegisterUserInput = z.infer<typeof registerUserInputSchema>;

// Input schema for user login
export const loginUserInputSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export type LoginUserInput = z.infer<typeof loginUserInputSchema>;

// Search input schema
export const searchRecipesInputSchema = z.object({
  query: z.string().optional(),
  ingredients: z.array(z.string()).optional(),
  categories: z.array(z.string()).optional(),
});

export type SearchRecipesInput = z.infer<typeof searchRecipesInputSchema>;
