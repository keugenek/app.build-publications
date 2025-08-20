import { z } from 'zod';

// Product schema
export const productSchema = z.object({
  id: z.number(),
  name: z.string(),
  sku: z.string(),
  stock_quantity: z.number().int().nonnegative(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Product = z.infer<typeof productSchema>;

// Input schema for creating products
export const createProductInputSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  sku: z.string().min(1, "SKU is required"),
  stock_quantity: z.number().int().nonnegative().default(0)
});

export type CreateProductInput = z.infer<typeof createProductInputSchema>;

// Input schema for updating products
export const updateProductInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1, "Product name is required").optional(),
  sku: z.string().min(1, "SKU is required").optional(),
  stock_quantity: z.number().int().nonnegative().optional()
});

export type UpdateProductInput = z.infer<typeof updateProductInputSchema>;

// Stock transaction schema
export const stockTransactionSchema = z.object({
  id: z.number(),
  product_id: z.number(),
  transaction_type: z.enum(['IN', 'OUT']),
  quantity: z.number().int().positive(),
  notes: z.string().nullable(),
  created_at: z.coerce.date()
});

export type StockTransaction = z.infer<typeof stockTransactionSchema>;

// Input schema for creating stock transactions
export const createStockTransactionInputSchema = z.object({
  product_id: z.number(),
  transaction_type: z.enum(['IN', 'OUT']),
  quantity: z.number().int().positive(),
  notes: z.string().nullable().optional()
});

export type CreateStockTransactionInput = z.infer<typeof createStockTransactionInputSchema>;

// Input schema for getting stock transactions by product
export const productIdInputSchema = z.object({
  productId: z.number()
});

export type ProductIdInput = z.infer<typeof productIdInputSchema>;

// Input schema for updating product stock
export const updateProductStockInputSchema = z.object({
  productId: z.number(),
  newQuantity: z.number().int().nonnegative()
});

export type UpdateProductStockInput = z.infer<typeof updateProductStockInputSchema>;
