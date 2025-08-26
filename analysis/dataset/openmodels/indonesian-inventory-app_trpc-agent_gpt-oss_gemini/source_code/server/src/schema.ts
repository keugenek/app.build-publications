import { z } from 'zod';

// -----------------------------------------------------------------------------
// Item (Barang) schemas
// -----------------------------------------------------------------------------
export const unitEnum = ['Pcs', 'Kotak'] as const;
export const unitSchema = z.enum(unitEnum);

export const itemSchema = z.object({
  id: z.number(),
  name: z.string(),
  code: z.string(),
  description: z.string().nullable(),
  purchase_price: z.number(), // Harga Beli
  sale_price: z.number(), // Harga Jual
  unit: unitSchema, // Satuan
  stock: z.number().int(), // Stok saat ini
  created_at: z.coerce.date()
});

export type Item = z.infer<typeof itemSchema>;

// Input schema for creating a new item
export const createItemInputSchema = z.object({
  name: z.string(),
  code: z.string(),
  description: z.string().nullable(),
  purchase_price: z.number().positive(),
  sale_price: z.number().positive(),
  unit: unitSchema,
  // stock is optional on create, default 0
  stock: z.number().int().nonnegative().optional()
});

export type CreateItemInput = z.infer<typeof createItemInputSchema>;

// Input schema for updating an existing item
export const updateItemInputSchema = z.object({
  id: z.number(),
  name: z.string().optional(),
  code: z.string().optional(),
  description: z.string().nullable().optional(),
  purchase_price: z.number().positive().optional(),
  sale_price: z.number().positive().optional(),
  unit: unitSchema.optional(),
  stock: z.number().int().nonnegative().optional()
});

export type UpdateItemInput = z.infer<typeof updateItemInputSchema>;

// -----------------------------------------------------------------------------
// Transaction (Transaksi) schemas
// -----------------------------------------------------------------------------
export const transactionTypeEnum = ['masuk', 'keluar'] as const;
export const transactionTypeSchema = z.enum(transactionTypeEnum);

export const transactionSchema = z.object({
  id: z.number(),
  item_id: z.number(),
  date: z.coerce.date(),
  quantity: z.number().int(), // Positive for masuk, negative for keluar
  note: z.string().nullable(),
  type: transactionTypeSchema,
  created_at: z.coerce.date()
});

export type Transaction = z.infer<typeof transactionSchema>;

export const createTransactionInputSchema = z.object({
  item_id: z.number(),
  date: z.coerce.date(),
  quantity: z.number().int().positive(), // quantity of items added/removed
  note: z.string().nullable(),
  type: transactionTypeSchema
});

export type CreateTransactionInput = z.infer<typeof createTransactionInputSchema>;
