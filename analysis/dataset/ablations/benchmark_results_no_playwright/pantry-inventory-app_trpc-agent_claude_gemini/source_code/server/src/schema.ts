import { z } from 'zod';

// Pantry item schema
export const pantryItemSchema = z.object({
  id: z.number(),
  name: z.string(),
  quantity: z.number().positive(),
  unit: z.string(), // e.g., "cups", "pieces", "grams", "ml"
  expiry_date: z.coerce.date(),
  added_date: z.coerce.date(),
  is_expired: z.boolean().optional(), // Computed field for notifications
  days_until_expiry: z.number().optional() // Computed field for sorting/filtering
});

export type PantryItem = z.infer<typeof pantryItemSchema>;

// Input schema for creating pantry items
export const createPantryItemInputSchema = z.object({
  name: z.string().min(1, "Item name is required"),
  quantity: z.number().positive("Quantity must be positive"),
  unit: z.string().min(1, "Unit is required"),
  expiry_date: z.coerce.date()
});

export type CreatePantryItemInput = z.infer<typeof createPantryItemInputSchema>;

// Input schema for updating pantry items
export const updatePantryItemInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  quantity: z.number().positive().optional(),
  unit: z.string().min(1).optional(),
  expiry_date: z.coerce.date().optional()
});

export type UpdatePantryItemInput = z.infer<typeof updatePantryItemInputSchema>;

// Recipe suggestion schema
export const recipeSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string(),
  ingredients: z.array(z.string()), // Array of ingredient names
  instructions: z.string(),
  prep_time_minutes: z.number().int().nonnegative(),
  cook_time_minutes: z.number().int().nonnegative(),
  servings: z.number().int().positive(),
  created_at: z.coerce.date()
});

export type Recipe = z.infer<typeof recipeSchema>;

// Input schema for creating recipes
export const createRecipeInputSchema = z.object({
  title: z.string().min(1, "Recipe title is required"),
  description: z.string(),
  ingredients: z.array(z.string().min(1)).min(1, "At least one ingredient is required"),
  instructions: z.string().min(1, "Instructions are required"),
  prep_time_minutes: z.number().int().nonnegative(),
  cook_time_minutes: z.number().int().nonnegative(),
  servings: z.number().int().positive()
});

export type CreateRecipeInput = z.infer<typeof createRecipeInputSchema>;

// Notification schema for expiry alerts
export const notificationSchema = z.object({
  id: z.number(),
  pantry_item_id: z.number(),
  message: z.string(),
  notification_type: z.enum(['expiring_soon', 'expired']),
  is_read: z.boolean(),
  created_at: z.coerce.date()
});

export type Notification = z.infer<typeof notificationSchema>;

// Input schema for marking notifications as read
export const markNotificationReadInputSchema = z.object({
  id: z.number()
});

export type MarkNotificationReadInput = z.infer<typeof markNotificationReadInputSchema>;

// Recipe suggestion input schema
export const getRecipeSuggestionsInputSchema = z.object({
  available_ingredients: z.array(z.string()).optional(), // If not provided, use all pantry items
  max_suggestions: z.number().int().positive().max(20).default(10)
});

export type GetRecipeSuggestionsInput = z.infer<typeof getRecipeSuggestionsInputSchema>;

// Expiry notification input schema
export const getExpiryNotificationsInputSchema = z.object({
  days_ahead: z.number().int().positive().max(30).default(7), // Notify for items expiring within N days
  include_expired: z.boolean().default(true)
});

export type GetExpiryNotificationsInput = z.infer<typeof getExpiryNotificationsInputSchema>;
