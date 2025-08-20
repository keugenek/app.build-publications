import { z } from 'zod';

// Output schema for a recipe (as stored/retrieved from DB)
export const recipeSchema = z.object({
  id: z.number(),
  title: z.string(),
  ingredients: z.array(z.string()),
  instructions: z.string(),
  categories: z.array(z.string()),
  created_at: z.coerce.date(),
});

export type Recipe = z.infer<typeof recipeSchema>;

// Input schema for creating a new recipe
export const createRecipeInputSchema = z.object({
  title: z.string(),
  ingredients: z.array(z.string()),
  instructions: z.string(),
  categories: z.array(z.string()),
});

export type CreateRecipeInput = z.infer<typeof createRecipeInputSchema>;

// Input schema for fetching a single recipe by ID
export const recipeIdInputSchema = z.object({
  id: z.number().int().positive(),
});

export type RecipeIdInput = z.infer<typeof recipeIdInputSchema>;

// Input schema for searching recipes
export const searchRecipesInputSchema = z.object({
  title: z.string().optional(),
  categories: z.array(z.string()).optional(),
  ingredient: z.string().optional(),
});

export type SearchRecipesInput = z.infer<typeof searchRecipesInputSchema>;
