import { z } from 'zod';

// Define category enum values
export const categoryEnum = ['Breakfast', 'Lunch', 'Dinner', 'Dessert', 'Appetizer'] as const;
export type CategoryEnum = typeof categoryEnum[number];

// Recipe schema
export const recipeSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string(),
  ingredients: z.array(z.string()),
  instructions: z.string(),
  imageUrl: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type Recipe = z.infer<typeof recipeSchema>;

// Category schema
export const categorySchema = z.object({
  id: z.number(),
  name: z.string(),
  createdAt: z.coerce.date(),
});

export type Category = z.infer<typeof categorySchema>;

// Custom Category schema
export const customCategorySchema = z.object({
  id: z.number(),
  name: z.string(),
  userId: z.string(),
  createdAt: z.coerce.date(),
});

export type CustomCategory = z.infer<typeof customCategorySchema>;

// Bookmark schema
export const bookmarkSchema = z.object({
  id: z.number(),
  recipeId: z.number(),
  userId: z.string(),
  createdAt: z.coerce.date(),
});

export type Bookmark = z.infer<typeof bookmarkSchema>;

// Input schema for creating recipes
export const createRecipeInputSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(1000),
  ingredients: z.array(z.string().min(1)).min(1),
  instructions: z.string().min(1),
  categoryIds: z.array(z.number()).min(1), // IDs of selected categories
  imageUrl: z.string().nullable(), // Optional image URL
});

export type CreateRecipeInput = z.infer<typeof createRecipeInputSchema>;

// Input schema for updating recipes
export const updateRecipeInputSchema = z.object({
  id: z.number(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(1).max(1000).optional(),
  ingredients: z.array(z.string().min(1)).min(1).optional(),
  instructions: z.string().min(1).optional(),
  categoryIds: z.array(z.number()).min(1).optional(),
  imageUrl: z.string().nullable().optional(),
});

export type UpdateRecipeInput = z.infer<typeof updateRecipeInputSchema>;

// Input schema for creating categories
export const createCategoryInputSchema = z.object({
  name: z.string().min(1).max(50),
});

export type CreateCategoryInput = z.infer<typeof createCategoryInputSchema>;

// Input schema for creating custom categories
export const createCustomCategoryInputSchema = z.object({
  name: z.string().min(1).max(50),
  userId: z.string().min(1),
});

export type CreateCustomCategoryInput = z.infer<typeof createCustomCategoryInputSchema>;

// Input schema for bookmarking recipes
export const createBookmarkInputSchema = z.object({
  recipeId: z.number(),
  userId: z.string().min(1),
});

export type CreateBookmarkInput = z.infer<typeof createBookmarkInputSchema>;

// Input schema for searching recipes
export const searchRecipesInputSchema = z.object({
  query: z.string().optional(),
  categoryIds: z.array(z.number()).optional(),
});

export type SearchRecipesInput = z.infer<typeof searchRecipesInputSchema>;
