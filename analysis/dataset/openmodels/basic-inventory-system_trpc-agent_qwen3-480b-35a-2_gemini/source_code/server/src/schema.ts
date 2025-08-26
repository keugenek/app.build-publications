import { z } from 'zod';

// Product schema
export const productSchema = z.object({
  id: z.number(),
  name: z.string(),
  sku: z.string(),
  stock_level: z.number().int(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Product = z.infer<typeof productSchema>;

// Input schema for creating products
export const createProductInputSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  sku: z.string().min(1, "SKU is required"),
  stock_level: z.number().int().nonnegative().default(0)
});

export type CreateProductInput = z.infer<typeof createProductInputSchema>;

// Input schema for updating products
export const updateProductInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1, "Product name is required").optional(),
  sku: z.string().min(1, "SKU is required").optional(),
  stock_level: z.number().int().nonnegative().optional()
});

export type UpdateProductInput = z.infer<typeof updateProductInputSchema>;

// Transaction schema
export const transactionSchema = z.object({
  id: z.number(),
  product_sku: z.string(),
  transaction_type: z.enum(['stock-in', 'stock-out']),
  quantity: z.number().int().positive(),
  transaction_date: z.coerce.date(),
  created_at: z.coerce.date()
});

export type Transaction = z.infer<typeof transactionSchema>;

// Input schema for creating transactions
export const createTransactionInputSchema = z.object({
  product_sku: z.string().min(1, "Product SKU is required"),
  transaction_type: z.enum(['stock-in', 'stock-out']),
  quantity: z.number().int().positive().min(1, "Quantity must be at least 1")
});

export type CreateTransactionInput = z.infer<typeof createTransactionInputSchema>;
