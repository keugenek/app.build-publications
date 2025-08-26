import { z } from 'zod';

// ---------- Product Schemas ----------
export const productSchema = z.object({
  id: z.number(),
  name: z.string(),
  sku: z.string(),
  stock_quantity: z.number().int(), // current stock level, integer
  created_at: z.coerce.date(),
});

export type Product = z.infer<typeof productSchema>;

export const createProductInputSchema = z.object({
  name: z.string(),
  sku: z.string(),
  stock_quantity: z.number().int().nonnegative(), // initial stock, can be zero
});

export type CreateProductInput = z.infer<typeof createProductInputSchema>;

export const updateProductInputSchema = z.object({
  id: z.number(),
  name: z.string().optional(),
  sku: z.string().optional(),
  stock_quantity: z.number().int().nonnegative().optional(),
});

export type UpdateProductInput = z.infer<typeof updateProductInputSchema>;

// ---------- Stock Transaction Schemas ----------
// Enum for transaction type: stock_in or stock_out
export const transactionTypeEnum = z.enum(['stock_in', 'stock_out']);
export type TransactionType = z.infer<typeof transactionTypeEnum>;

export const stockTransactionSchema = z.object({
  id: z.number(),
  product_id: z.number(),
  type: transactionTypeEnum,
  quantity: z.number().int().positive(),
  created_at: z.coerce.date(),
});

export type StockTransaction = z.infer<typeof stockTransactionSchema>;

export const createStockTransactionInputSchema = z.object({
  product_id: z.number(),
  type: transactionTypeEnum,
  quantity: z.number().int().positive(),
});

export type CreateStockTransactionInput = z.infer<typeof createStockTransactionInputSchema>;
