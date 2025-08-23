import { z } from 'zod';

// Product schema
export const productSchema = z.object({
  id: z.number(),
  name: z.string(),
  sku: z.string(),
  stockLevel: z.number().int().nonnegative(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type Product = z.infer<typeof productSchema>;

// Input schema for creating products
export const createProductInputSchema = z.object({
  name: z.string().min(1, "Name is required"),
  sku: z.string().min(1, "SKU is required"),
  stockLevel: z.number().int().nonnegative().default(0),
});

export type CreateProductInput = z.infer<typeof createProductInputSchema>;

// Input schema for updating products
export const updateProductInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1, "Name is required").optional(),
  sku: z.string().min(1, "SKU is required").optional(),
  stockLevel: z.number().int().nonnegative().optional(),
});

export type UpdateProductInput = z.infer<typeof updateProductInputSchema>;

// Transaction type enum
export const transactionTypeEnum = z.enum(['STOCK_IN', 'STOCK_OUT']);

// Stock transaction schema
export const stockTransactionSchema = z.object({
  id: z.number(),
  productId: z.number(),
  quantity: z.number().int().positive(),
  transactionType: transactionTypeEnum,
  transactionDate: z.coerce.date(),
});

export type StockTransaction = z.infer<typeof stockTransactionSchema>;

// Input schema for creating stock transactions
export const createStockTransactionInputSchema = z.object({
  productId: z.number(),
  quantity: z.number().int().positive(),
  transactionType: transactionTypeEnum,
});

export type CreateStockTransactionInput = z.infer<typeof createStockTransactionInputSchema>;
