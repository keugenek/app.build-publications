import { z } from 'zod';

// Pantry item schema
export const pantryItemSchema = z.object({
  id: z.number(),
  name: z.string(),
  quantity: z.number().positive(), // Positive number for quantity
  expiry_date: z.coerce.date(), // Automatically converts string dates to Date objects
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type PantryItem = z.infer<typeof pantryItemSchema>;

// Input schema for creating pantry items
export const createPantryItemInputSchema = z.object({
  name: z.string().min(1, "Item name is required"),
  quantity: z.number().positive("Quantity must be positive"),
  expiry_date: z.coerce.date()
});

export type CreatePantryItemInput = z.infer<typeof createPantryItemInputSchema>;

// Input schema for updating pantry items
export const updatePantryItemInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  quantity: z.number().positive().optional(),
  expiry_date: z.coerce.date().optional()
});

export type UpdatePantryItemInput = z.infer<typeof updatePantryItemInputSchema>;

// Input schema for deleting pantry items
export const deletePantryItemInputSchema = z.object({
  id: z.number()
});

export type DeletePantryItemInput = z.infer<typeof deletePantryItemInputSchema>;

// Schema for recipe suggestion request
export const recipeRequestSchema = z.object({
  item_ids: z.array(z.number()).optional(), // Optional array of specific item IDs to use
  max_recipes: z.number().int().positive().default(5) // Maximum number of recipe suggestions
});

export type RecipeRequest = z.infer<typeof recipeRequestSchema>;

// Recipe suggestion schema
export const recipeSchema = z.object({
  title: z.string(),
  description: z.string(),
  ingredients_used: z.array(z.string()), // List of pantry items used in this recipe
  instructions: z.string(),
  prep_time_minutes: z.number().int().nonnegative().nullable(),
  difficulty_level: z.enum(["easy", "medium", "hard"]).nullable()
});

export type Recipe = z.infer<typeof recipeSchema>;

// Response schema for recipe suggestions
export const recipeSuggestionsResponseSchema = z.object({
  recipes: z.array(recipeSchema),
  pantry_items_used: z.array(pantryItemSchema), // The pantry items that were considered
  items_expiring_soon: z.array(pantryItemSchema) // Items expiring within a week
});

export type RecipeSuggestionsResponse = z.infer<typeof recipeSuggestionsResponseSchema>;

// Schema for getting expiring items
export const expiringItemsRequestSchema = z.object({
  days_ahead: z.number().int().positive().default(7) // How many days ahead to check for expiring items
});

export type ExpiringItemsRequest = z.infer<typeof expiringItemsRequestSchema>;
