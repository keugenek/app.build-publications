import { z } from 'zod';

// Pantry item schema
export const pantryItemSchema = z.object({
  id: z.number(),
  name: z.string(),
  quantity: z.number().int().nonnegative(),
  expiry_date: z.coerce.date(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

export type PantryItem = z.infer<typeof pantryItemSchema>;

// Input schema for creating pantry items
export const createPantryItemInputSchema = z.object({
  name: z.string().min(1, "Name is required"),
  quantity: z.number().int().nonnegative(),
  expiry_date: z.coerce.date(),
});

export type CreatePantryItemInput = z.infer<typeof createPantryItemInputSchema>;

// Input schema for updating pantry items
export const updatePantryItemInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1, "Name is required").optional(),
  quantity: z.number().int().nonnegative().optional(),
  expiry_date: z.coerce.date().optional(),
});

export type UpdatePantryItemInput = z.infer<typeof updatePantryItemInputSchema>;

// Recipe suggestion schema
export const recipeSuggestionSchema = z.object({
  id: z.number(),
  name: z.string(),
  ingredients: z.array(z.string()),
  instructions: z.string(),
});

export type RecipeSuggestion = z.infer<typeof recipeSuggestionSchema>;
