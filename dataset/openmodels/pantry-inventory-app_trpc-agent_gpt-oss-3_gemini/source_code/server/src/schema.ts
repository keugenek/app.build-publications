import { z } from 'zod';

// Enum for unit types
export const unitEnum = ['grams', 'pieces', 'liters'] as const;
export const unitSchema = z.enum(unitEnum);

// Pantry item schema (output)
export const pantryItemSchema = z.object({
  id: z.number(),
  name: z.string(),
  quantity: z.number(), // Stored as numeric in DB, represented as number in TS
  unit: unitSchema,
  expiry_date: z.coerce.date(), // Convert string timestamps to Date
  created_at: z.coerce.date()
});

export type PantryItem = z.infer<typeof pantryItemSchema>;

// Input schema for creating a pantry item
export const createPantryItemInputSchema = z.object({
  name: z.string(),
  quantity: z.number().positive(),
  unit: unitSchema,
  expiry_date: z.coerce.date()
});

export type CreatePantryItemInput = z.infer<typeof createPantryItemInputSchema>;

// Input schema for updating a pantry item
export const updatePantryItemInputSchema = z.object({
  id: z.number(),
  name: z.string().optional(),
  quantity: z.number().positive().optional(),
  unit: unitSchema.optional(),
  expiry_date: z.coerce.date().optional()
});

export type UpdatePantryItemInput = z.infer<typeof updatePantryItemInputSchema>;
