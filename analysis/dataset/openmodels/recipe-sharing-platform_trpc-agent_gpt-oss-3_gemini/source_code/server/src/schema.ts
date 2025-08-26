import { z } from 'zod';

// User schema
export const userSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  password_hash: z.string(),
  created_at: z.coerce.date()
});
export type User = z.infer<typeof userSchema>;

// Recipe schema (output)
export const recipeSchema = z.object({
  id: z.number(),
  name: z.string(),
  ingredients: z.array(z.string()),
  instructions: z.string(),
  categories: z.array(z.string()).nullable(),
  created_at: z.coerce.date()
});
export type Recipe = z.infer<typeof recipeSchema>;

// Input schema for creating a recipe
export const createRecipeInputSchema = z.object({
  name: z.string(),
  ingredients: z.array(z.string()).nonempty(),
  instructions: z.string(),
  categories: z.array(z.string()).nullable().optional() // optional, can be omitted
});
export type CreateRecipeInput = z.infer<typeof createRecipeInputSchema>;

// Input schema for searching recipes
export const searchRecipesInputSchema = z.object({
  query: z.string()
});
export type SearchRecipesInput = z.infer<typeof searchRecipesInputSchema>;

// Input schema for favoriting a recipe
export const favoriteRecipeInputSchema = z.object({
  recipe_id: z.number()
});
export type FavoriteRecipeInput = z.infer<typeof favoriteRecipeInputSchema>;
