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
  name: z.string().min(1, 'Product name is required'),
  sku: z.string().min(1, 'SKU is required'),
  stock_level: z.number().int().nonnegative('Stock level must be non-negative').default(0)
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

// Stock movement types enum
export const stockMovementTypeSchema = z.enum(['stock-in', 'stock-out']);

export type StockMovementType = z.infer<typeof stockMovementTypeSchema>;

// Stock movement schema
export const stockMovementSchema = z.object({
  id: z.number(),
  product_id: z.number(),
  movement_type: stockMovementTypeSchema,
  quantity: z.number().int().positive(),
  notes: z.string().nullable(),
  created_at: z.coerce.date()
});

export type StockMovement = z.infer<typeof stockMovementSchema>;

// Input schema for creating stock movements
export const createStockMovementInputSchema = z.object({
  product_id: z.number(),
  movement_type: stockMovementTypeSchema,
  quantity: z.number().int().positive('Quantity must be positive'),
  notes: z.string().nullable().optional()
});

export type CreateStockMovementInput = z.infer<typeof createStockMovementInputSchema>;

// Schema for stock movement with product details
export const stockMovementWithProductSchema = z.object({
  id: z.number(),
  product_id: z.number(),
  movement_type: stockMovementTypeSchema,
  quantity: z.number().int(),
  notes: z.string().nullable(),
  created_at: z.coerce.date(),
  product: productSchema
});

export type StockMovementWithProduct = z.infer<typeof stockMovementWithProductSchema>;
