import { z } from 'zod';

// Product schema
export const productSchema = z.object({
  id: z.number(),
  name: z.string(),
  sku: z.string(),
  description: z.string().nullable(),
  stock_level: z.number().int().nonnegative(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Product = z.infer<typeof productSchema>;

// Input schema for creating products
export const createProductInputSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  sku: z.string().min(1, "SKU is required"),
  description: z.string().nullable().optional(),
  initial_stock: z.number().int().nonnegative().default(0)
});

export type CreateProductInput = z.infer<typeof createProductInputSchema>;

// Input schema for updating products
export const updateProductInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  sku: z.string().min(1).optional(),
  description: z.string().nullable().optional()
});

export type UpdateProductInput = z.infer<typeof updateProductInputSchema>;

// Transaction types enum
export const transactionTypeEnum = z.enum(['STOCK_IN', 'STOCK_OUT']);
export type TransactionType = z.infer<typeof transactionTypeEnum>;

// Stock transaction schema
export const stockTransactionSchema = z.object({
  id: z.number(),
  product_id: z.number(),
  transaction_type: transactionTypeEnum,
  quantity: z.number().int().positive(),
  notes: z.string().nullable(),
  created_at: z.coerce.date()
});

export type StockTransaction = z.infer<typeof stockTransactionSchema>;

// Input schema for creating stock transactions
export const createStockTransactionInputSchema = z.object({
  product_id: z.number(),
  transaction_type: transactionTypeEnum,
  quantity: z.number().int().positive(),
  notes: z.string().nullable().optional()
});

export type CreateStockTransactionInput = z.infer<typeof createStockTransactionInputSchema>;

// Schema for getting product with transactions
export const productWithTransactionsSchema = z.object({
  id: z.number(),
  name: z.string(),
  sku: z.string(),
  description: z.string().nullable(),
  stock_level: z.number().int().nonnegative(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
  transactions: z.array(stockTransactionSchema)
});

export type ProductWithTransactions = z.infer<typeof productWithTransactionsSchema>;

// Input schema for getting transactions by product
export const getTransactionsByProductInputSchema = z.object({
  product_id: z.number()
});

export type GetTransactionsByProductInput = z.infer<typeof getTransactionsByProductInputSchema>;

// Input schema for getting product by ID
export const getProductByIdInputSchema = z.object({
  id: z.number()
});

export type GetProductByIdInput = z.infer<typeof getProductByIdInputSchema>;

// Input schema for deleting product
export const deleteProductInputSchema = z.object({
  id: z.number()
});

export type DeleteProductInput = z.infer<typeof deleteProductInputSchema>;
