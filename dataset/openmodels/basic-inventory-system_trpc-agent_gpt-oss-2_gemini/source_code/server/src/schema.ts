import { z } from 'zod';

// ---------- Product Schemas ----------
export const productSchema = z.object({
  id: z.number(),
  name: z.string(),
  sku: z.string(),
  stock_quantity: z.number().int(),
  created_at: z.coerce.date(),
});

export type Product = z.infer<typeof productSchema>;

export const createProductInputSchema = z.object({
  name: z.string(),
  sku: z.string(),
  stock_quantity: z.number().int().nonnegative().optional(), // optional, default handled in DB
});

export type CreateProductInput = z.infer<typeof createProductInputSchema>;

export const updateProductInputSchema = z.object({
  id: z.number(),
  name: z.string().optional(),
  sku: z.string().optional(),
  stock_quantity: z.number().int().optional(),
});

export type UpdateProductInput = z.infer<typeof updateProductInputSchema>;

// ---------- Stock-In Schemas ----------
export const stockInSchema = z.object({
  id: z.number(),
  product_id: z.number(),
  quantity: z.number().int().positive(),
  transaction_date: z.coerce.date(),
});

export type StockIn = z.infer<typeof stockInSchema>;

export const createStockInInputSchema = z.object({
  product_id: z.number(),
  quantity: z.number().int().positive(),
  transaction_date: z.coerce.date().optional(),
});

export type CreateStockInInput = z.infer<typeof createStockInInputSchema>;

// ---------- Stock-Out Schemas ----------
export const stockOutSchema = z.object({
  id: z.number(),
  product_id: z.number(),
  quantity: z.number().int().positive(),
  transaction_date: z.coerce.date(),
});

export type StockOut = z.infer<typeof stockOutSchema>;

export const createStockOutInputSchema = z.object({
  product_id: z.number(),
  quantity: z.number().int().positive(),
  transaction_date: z.coerce.date().optional(),
});

export type CreateStockOutInput = z.infer<typeof createStockOutInputSchema>;
