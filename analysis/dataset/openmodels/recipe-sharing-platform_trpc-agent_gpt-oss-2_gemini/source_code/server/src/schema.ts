import { z } from 'zod';

// Recipe output schema (matches DB representation)
export const recipeSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().nullable(), // description can be explicitly null
  ingredients: z.array(z.string()), // list of ingredient strings
  instructions: z.string(),
  categories: z.array(z.string()), // list of category strings
  image_url: z.string().url().nullable(), // optional image URL
  created_at: z.coerce.date(), // timestamp from DB
});

export type Recipe = z.infer<typeof recipeSchema>;

// Input schema for creating a recipe (no id, created_at)
export const createRecipeInputSchema = z.object({
  title: z.string(),
  description: z.string().nullable().optional(), // optional field, can be null
  ingredients: z.array(z.string()).min(1), // at least one ingredient
  instructions: z.string(),
  categories: z.array(z.string()).min(1), // at least one category
  image_url: z.string().url().nullable().optional(),
});

export type CreateRecipeInput = z.infer<typeof createRecipeInputSchema>;

// Input schema for searching recipes
export const searchRecipesInputSchema = z.object({
  query: z.string().optional(), // free text search across title, ingredients, categories
  title: z.string().optional(),
  ingredient: z.string().optional(),
  category: z.string().optional(),
});

export type SearchRecipesInput = z.infer<typeof searchRecipesInputSchema>;
