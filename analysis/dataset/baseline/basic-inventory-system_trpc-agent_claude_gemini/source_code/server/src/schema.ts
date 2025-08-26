import { z } from 'zod';

// Product schema
export const productSchema = z.object({
  id: z.number(),
  name: z.string(),
  sku: z.string(),
  stock_level: z.number().int().nonnegative(),
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

// Stock transaction schema
export const stockTransactionSchema = z.object({
  id: z.number(),
  product_id: z.number(),
  transaction_type: transactionTypeSchema,
  quantity: z.number().int().positive(),
  notes: z.string().nullable(),
  created_at: z.coerce.date()
});

export type StockTransaction = z.infer<typeof stockTransactionSchema>;

// Input schema for creating stock transactions
export const createStockTransactionInputSchema = z.object({
  product_id: z.number(),
  transaction_type: transactionTypeSchema,
  quantity: z.number().int().positive("Quantity must be greater than 0"),
  notes: z.string().nullable().optional()
});

export type CreateStockTransactionInput = z.infer<typeof createStockTransactionInputSchema>;

// Schema for getting product by ID
export const getProductByIdInputSchema = z.object({
  id: z.number()
});

export type GetProductByIdInput = z.infer<typeof getProductByIdInputSchema>;

// Schema for getting transactions by product
export const getTransactionsByProductInputSchema = z.object({
  product_id: z.number()
});

export type GetTransactionsByProductInput = z.infer<typeof getTransactionsByProductInputSchema>;

// Schema for deleting a product
export const deleteProductInputSchema = z.object({
  id: z.number()
});

export type DeleteProductInput = z.infer<typeof deleteProductInputSchema>;
