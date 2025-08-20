import { z } from 'zod';

// Enum definitions for unit and category
export const unitEnum = z.enum([
  'g',
  'kg',
  'lb',
  'oz',
  'ml',
  'l',
  'pcs',
]);
export type Unit = z.infer<typeof unitEnum>;

export const categoryEnum = z.enum([
  'Produce',
  'Dairy',
  'Meat',
  'Grains',
  'Spices',
  'Other',
]);
export type Category = z.infer<typeof categoryEnum>;

// Main pantry item schema (output)
export const pantryItemSchema = z.object({
  id: z.number(),
  name: z.string(),
  quantity: z.number().positive(),
  unit: unitEnum,
  purchase_date: z.coerce.date(),
  expiry_date: z.coerce.date(),
  category: categoryEnum,
  created_at: z.coerce.date(),
});

export type PantryItem = z.infer<typeof pantryItemSchema>;

// Input schema for creating a pantry item
export const createPantryItemInputSchema = z.object({
  name: z.string(),
  quantity: z.number().positive(),
  unit: unitEnum,
  purchase_date: z.coerce.date(),
  expiry_date: z.coerce.date(),
  category: categoryEnum,
});

export type CreatePantryItemInput = z.infer<typeof createPantryItemInputSchema>;

// Input schema for updating a pantry item (all fields optional except id)
export const updatePantryItemInputSchema = z.object({
  id: z.number(),
  name: z.string().optional(),
  quantity: z.number().positive().optional(),
  unit: unitEnum.optional(),
  purchase_date: z.coerce.date().optional(),
  expiry_date: z.coerce.date().optional(),
  category: categoryEnum.optional(),
});

export type UpdatePantryItemInput = z.infer<typeof updatePantryItemInputSchema>;

// Input schema for fetching items nearing expiry (optional days threshold)
export const nearExpiryInputSchema = z.object({
  days: z.number().int().positive().optional(), // defaults can be handled in handler
});

export type NearExpiryInput = z.infer<typeof nearExpiryInputSchema>;

// Input schema for suggesting recipes based on available ingredients
export const suggestRecipesInputSchema = z.object({
  ingredients: z.array(z.string()).nonempty(),
});

export type SuggestRecipesInput = z.infer<typeof suggestRecipesInputSchema>;
