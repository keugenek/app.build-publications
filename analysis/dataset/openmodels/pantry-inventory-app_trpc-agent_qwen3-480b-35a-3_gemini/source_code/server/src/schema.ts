import { z } from 'zod';

// Define category enum
export const categoryEnum = z.enum(['Dairy', 'Produce', 'Canned Goods', 'Grains', 'Condiments', 'Beverages', 'Snacks', 'Other']);

export type Category = z.infer<typeof categoryEnum>;

// Pantry item schema
export const pantryItemSchema = z.object({
  id: z.number(),
  name: z.string(),
  quantity: z.number().int().nonnegative(),
  expiry_date: z.coerce.date(),
  category: categoryEnum,
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type PantryItem = z.infer<typeof pantryItemSchema>;

// Input schema for creating pantry items
export const createPantryItemInputSchema = z.object({
  name: z.string().min(1, "Name is required"),
  quantity: z.number().int().nonnegative(),
  expiry_date: z.coerce.date(),
  category: categoryEnum
});

export type CreatePantryItemInput = z.infer<typeof createPantryItemInputSchema>;

// Input schema for updating pantry items
export const updatePantryItemInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1, "Name is required").optional(),
  quantity: z.number().int().nonnegative().optional(),
  expiry_date: z.coerce.date().optional(),
  category: categoryEnum.optional()
});

export type UpdatePantryItemInput = z.infer<typeof updatePantryItemInputSchema>;

// Schema for expiring items
export const expiringItemSchema = z.object({
  id: z.number(),
  name: z.string(),
  expiry_date: z.coerce.date(),
  days_until_expiry: z.number()
});

export type ExpiringItem = z.infer<typeof expiringItemSchema>;

// Schema for recipe suggestion input
export const recipeSuggestionInputSchema = z.object({
  pantry_items: z.array(z.number()) // Array of pantry item IDs
});

export type RecipeSuggestionInput = z.infer<typeof recipeSuggestionInputSchema>;

// Schema for recipe suggestions
export const recipeSuggestionSchema = z.object({
  id: z.number(),
  name: z.string(),
  ingredients: z.array(z.string()),
  instructions: z.string()
});

export type RecipeSuggestion = z.infer<typeof recipeSuggestionSchema>;
