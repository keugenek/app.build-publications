import { z } from 'zod';

// Recipe category enum
export const recipeCategorySchema = z.enum([
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

export type RecipeCategory = z.infer<typeof recipeCategorySchema>;

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
  categories: z.array(recipeCategorySchema), // JSON array of categories
  prep_time_minutes: z.number().int().nullable(),
  cook_time_minutes: z.number().int().nullable(),
  servings: z.number().int().nullable(),
  difficulty: z.enum(['easy', 'medium', 'hard']).nullable(),
  author_id: z.number(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Recipe = z.infer<typeof recipeSchema>;

// Saved recipe schema (user's personal collection)
export const savedRecipeSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  recipe_id: z.number(),
  saved_at: z.coerce.date()
});

export type SavedRecipe = z.infer<typeof savedRecipeSchema>;

// Input schemas for creating users
export const createUserInputSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email()
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

// Input schemas for creating recipes
export const createRecipeInputSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().nullable().optional(),
  ingredients: z.array(z.string().min(1)).min(1), // At least one ingredient required
  instructions: z.array(z.string().min(1)).min(1), // At least one instruction required
  categories: z.array(recipeCategorySchema).min(1), // At least one category required
  prep_time_minutes: z.number().int().positive().optional(),
  cook_time_minutes: z.number().int().positive().optional(),
  servings: z.number().int().positive().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  author_id: z.number()
});

export type CreateRecipeInput = z.infer<typeof createRecipeInputSchema>;

// Input schemas for updating recipes
export const updateRecipeInputSchema = z.object({
  id: z.number(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().nullable().optional(),
  ingredients: z.array(z.string().min(1)).min(1).optional(),
  instructions: z.array(z.string().min(1)).min(1).optional(),
  categories: z.array(recipeCategorySchema).min(1).optional(),
  prep_time_minutes: z.number().int().positive().optional(),
  cook_time_minutes: z.number().int().positive().optional(),
  servings: z.number().int().positive().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).nullable().optional()
});

export type UpdateRecipeInput = z.infer<typeof updateRecipeInputSchema>;

// Search recipes input schema
export const searchRecipesInputSchema = z.object({
  query: z.string().optional(), // Search in title, description, ingredients
  categories: z.array(recipeCategorySchema).optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  max_prep_time: z.number().int().positive().optional(),
  max_cook_time: z.number().int().positive().optional(),
  author_id: z.number().optional()
});

export type SearchRecipesInput = z.infer<typeof searchRecipesInputSchema>;

// Save recipe input schema
export const saveRecipeInputSchema = z.object({
  user_id: z.number(),
  recipe_id: z.number()
});

export type SaveRecipeInput = z.infer<typeof saveRecipeInputSchema>;

// Unsave recipe input schema
export const unsaveRecipeInputSchema = z.object({
  user_id: z.number(),
  recipe_id: z.number()
});

export type UnsaveRecipeInput = z.infer<typeof unsaveRecipeInputSchema>;

// Get saved recipes input schema
export const getSavedRecipesInputSchema = z.object({
  user_id: z.number()
});

export type GetSavedRecipesInput = z.infer<typeof getSavedRecipesInputSchema>;

// Get recipe by ID input schema
export const getRecipeByIdInputSchema = z.object({
  id: z.number()
});

export type GetRecipeByIdInput = z.infer<typeof getRecipeByIdInputSchema>;

// Delete recipe input schema
export const deleteRecipeInputSchema = z.object({
  id: z.number(),
  author_id: z.number() // Ensure only the author can delete their recipe
});

export type DeleteRecipeInput = z.infer<typeof deleteRecipeInputSchema>;
