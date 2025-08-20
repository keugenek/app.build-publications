import { z } from 'zod';

// Pantry item schema
export const pantryItemSchema = z.object({
  id: z.number(),
  name: z.string(),
  quantity: z.number(),
  unit: z.string(), // e.g., "cups", "pieces", "lbs", "oz"
  expiration_date: z.coerce.date(),
  category: z.string().nullable(), // e.g., "dairy", "vegetables", "meat"
  notes: z.string().nullable(), // Optional notes about the item
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type PantryItem = z.infer<typeof pantryItemSchema>;

// Input schema for creating pantry items
export const createPantryItemInputSchema = z.object({
  name: z.string().min(1, "Item name is required"),
  quantity: z.number().positive("Quantity must be positive"),
  unit: z.string().min(1, "Unit is required"),
  expiration_date: z.coerce.date(),
  category: z.string().nullable().optional(),
  notes: z.string().nullable().optional()
});

export type CreatePantryItemInput = z.infer<typeof createPantryItemInputSchema>;

// Input schema for updating pantry items
export const updatePantryItemInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  quantity: z.number().positive().optional(),
  unit: z.string().min(1).optional(),
  expiration_date: z.coerce.date().optional(),
  category: z.string().nullable().optional(),
  notes: z.string().nullable().optional()
});

export type UpdatePantryItemInput = z.infer<typeof updatePantryItemInputSchema>;

// Schema for expiring items alert
export const expiringItemsInputSchema = z.object({
  days_ahead: z.number().int().positive().default(7) // Default to 7 days
});

export type ExpiringItemsInput = z.infer<typeof expiringItemsInputSchema>;

// Recipe schema for recipe suggestions
export const recipeSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  ingredients: z.array(z.string()), // List of ingredient names
  instructions: z.string().nullable(),
  prep_time_minutes: z.number().int().nullable(),
  cook_time_minutes: z.number().int().nullable(),
  servings: z.number().int().nullable(),
  created_at: z.coerce.date()
});

export type Recipe = z.infer<typeof recipeSchema>;

// Input schema for creating recipes
export const createRecipeInputSchema = z.object({
  name: z.string().min(1, "Recipe name is required"),
  description: z.string().nullable().optional(),
  ingredients: z.array(z.string().min(1)),
  instructions: z.string().nullable().optional(),
  prep_time_minutes: z.number().int().positive().optional(),
  cook_time_minutes: z.number().int().positive().optional(),
  servings: z.number().int().positive().optional()
});

export type CreateRecipeInput = z.infer<typeof createRecipeInputSchema>;

// Schema for recipe suggestions based on available items
export const recipeSuggestionsInputSchema = z.object({
  min_matching_ingredients: z.number().int().positive().default(2) // Minimum ingredients that must match
});

export type RecipeSuggestionsInput = z.infer<typeof recipeSuggestionsInputSchema>;

// Response schema for recipe suggestions with matching info
export const recipeSuggestionSchema = z.object({
  recipe: recipeSchema,
  matching_ingredients: z.array(z.string()),
  missing_ingredients: z.array(z.string()),
  match_percentage: z.number() // Percentage of recipe ingredients available in pantry
});

export type RecipeSuggestion = z.infer<typeof recipeSuggestionSchema>;
