import { z } from 'zod';

// Product schema
export const productSchema = z.object({
  id: z.number(),
  name: z.string(),
  stock_quantity: z.number().int(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Product = z.infer<typeof productSchema>;

// Transaction schema
export const transactionSchema = z.object({
  id: z.number(),
  product_id: z.number(),
  type: z.enum(['masuk', 'keluar']),
  quantity: z.number().int(),
  transaction_date: z.coerce.date(),
  created_at: z.coerce.date()
});

export type Transaction = z.infer<typeof transactionSchema>;

// Input schema for creating products
export const createProductInputSchema = z.object({
  name: z.string(),
  stock_quantity: z.number().int().nonnegative()
});

export type CreateProductInput = z.infer<typeof createProductInputSchema>;

// Input schema for updating products
export const updateProductInputSchema = z.object({
  id: z.number(),
  name: z.string().optional(),
  stock_quantity: z.number().int().nonnegative().optional()
});

export type UpdateProductInput = z.infer<typeof updateProductInputSchema>;

// Input schema for creating transactions
export const createTransactionInputSchema = z.object({
  product_id: z.number(),
  type: z.enum(['masuk', 'keluar']),
  quantity: z.number().int().positive(),
  transaction_date: z.coerce.date()
});

export type CreateTransactionInput = z.infer<typeof createTransactionInputSchema>;

// Input schema for updating transactions
export const updateTransactionInputSchema = z.object({
  id: z.number(),
  product_id: z.number().optional(),
  type: z.enum(['masuk', 'keluar']).optional(),
  quantity: z.number().int().positive().optional(),
  transaction_date: z.coerce.date().optional()
});

export type UpdateTransactionInput = z.infer<typeof updateTransactionInputSchema>;