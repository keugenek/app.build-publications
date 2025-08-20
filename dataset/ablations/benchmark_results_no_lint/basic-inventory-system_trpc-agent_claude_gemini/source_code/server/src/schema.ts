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
  name: z.string().min(1).optional(),
  sku: z.string().min(1).optional(),
  stock_level: z.number().int().nonnegative().optional()
});

export type UpdateProductInput = z.infer<typeof updateProductInputSchema>;

// Transaction type enum
export const transactionTypeSchema = z.enum(['stock_in', 'stock_out']);
export type TransactionType = z.infer<typeof transactionTypeSchema>;

// Transaction schema
export const transactionSchema = z.object({
  id: z.number(),
  product_id: z.number(),
  type: transactionTypeSchema,
  quantity: z.number().int().positive(),
  notes: z.string().nullable(),
  created_at: z.coerce.date()
});

export type Transaction = z.infer<typeof transactionSchema>;

// Input schema for creating transactions
export const createTransactionInputSchema = z.object({
  product_id: z.number(),
  type: transactionTypeSchema,
  quantity: z.number().int().positive(),
  notes: z.string().nullable().optional()
});

export type CreateTransactionInput = z.infer<typeof createTransactionInputSchema>;

// Query schema for getting transactions with filters
export const getTransactionsInputSchema = z.object({
  product_id: z.number().optional(),
  type: transactionTypeSchema.optional(),
  limit: z.number().int().positive().max(100).default(50).optional(),
  offset: z.number().int().nonnegative().default(0).optional()
});

export type GetTransactionsInput = z.infer<typeof getTransactionsInputSchema>;

// Product with transaction summary
export const productWithStockSummarySchema = z.object({
  id: z.number(),
  name: z.string(),
  sku: z.string(),
  stock_level: z.number().int(),
  total_stock_in: z.number().int(),
  total_stock_out: z.number().int(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type ProductWithStockSummary = z.infer<typeof productWithStockSummarySchema>;
