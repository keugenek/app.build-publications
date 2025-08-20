import { z } from 'zod';

// Pantry item schema
export const pantryItemSchema = z.object({
  id: z.number(),
  name: z.string(),
  quantity: z.number(),
  expiry_date: z.coerce.date(),
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
  name: z.string().min(1, "Item name is required").optional(),
  quantity: z.number().positive("Quantity must be positive").optional(),
  expiry_date: z.coerce.date().optional()
});

export type UpdatePantryItemInput = z.infer<typeof updatePantryItemInputSchema>;

// Schema for getting items by expiry status
export const getItemsByExpiryInputSchema = z.object({
  days_ahead: z.number().int().nonnegative().default(7) // Default to 7 days for "expiring soon"
});

export type GetItemsByExpiryInput = z.infer<typeof getItemsByExpiryInputSchema>;

// Response schema for items with expiry status
export const pantryItemWithStatusSchema = pantryItemSchema.extend({
  expiry_status: z.enum(['fresh', 'expiring_soon', 'expired']),
  days_until_expiry: z.number() // Negative if expired, positive if fresh
});

export type PantryItemWithStatus = z.infer<typeof pantryItemWithStatusSchema>;
