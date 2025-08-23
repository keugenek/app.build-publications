import { z } from 'zod';

// Item schema
export const itemSchema = z.object({
  id: z.number(),
  name: z.string(),
  code: z.string(),
  description: z.string().nullable(),
  stock: z.number().int(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Item = z.infer<typeof itemSchema>;

// Input schema for creating items
export const createItemInputSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().min(1, "Code is required"),
  description: z.string().nullable(),
  stock: z.number().int().nonnegative().default(0)
});

export type CreateItemInput = z.infer<typeof createItemInputSchema>;

// Input schema for updating items
export const updateItemInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1, "Name is required").optional(),
  code: z.string().min(1, "Code is required").optional(),
  description: z.string().nullable().optional(),
  stock: z.number().int().nonnegative().optional()
});

export type UpdateItemInput = z.infer<typeof updateItemInputSchema>;

// Transaction schema
export const transactionSchema = z.object({
  id: z.number(),
  item_id: z.number(),
  type: z.enum(['in', 'out']),
  quantity: z.number().int().positive(),
  created_at: z.coerce.date()
});

export type Transaction = z.infer<typeof transactionSchema>;

// Input schema for creating transactions
export const createTransactionInputSchema = z.object({
  item_id: z.number(),
  type: z.enum(['in', 'out']),
  quantity: z.number().int().positive()
});

export type CreateTransactionInput = z.infer<typeof createTransactionInputSchema>;

// Input schema for deleting items
export const deleteItemInputSchema = z.object({
  id: z.number()
});

export type DeleteItemInput = z.infer<typeof deleteItemInputSchema>;
