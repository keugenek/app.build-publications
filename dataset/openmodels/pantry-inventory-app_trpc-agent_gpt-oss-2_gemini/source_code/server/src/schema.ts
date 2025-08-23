import { z } from 'zod';

// Pantry item schema (output)
export const pantryItemSchema = z.object({
  id: z.number(),
  name: z.string(),
  quantity: z.number().int().nonnegative(),
  expiry_date: z.coerce.date(), // accepts string ISO dates and converts to Date
  created_at: z.coerce.date(),
});

export type PantryItem = z.infer<typeof pantryItemSchema>;

// Input schema for creating a pantry item
export const createPantryItemInputSchema = z.object({
  name: z.string(),
  quantity: z.number().int().positive(),
  expiry_date: z.coerce.date(),
});

export type CreatePantryItemInput = z.infer<typeof createPantryItemInputSchema>;
