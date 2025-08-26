import { z } from 'zod';

// Supplier schema
export const supplierSchema = z.object({
  id: z.number(),
  name: z.string(),
  contact: z.string().nullable(),
  email: z.string().email().nullable(),
  phone: z.string().nullable(),
  address: z.string().nullable(),
  created_at: z.coerce.date()
});

export type Supplier = z.infer<typeof supplierSchema>;

// Customer schema
export const customerSchema = z.object({
  id: z.number(),
  name: z.string(),
  contact: z.string().nullable(),
  email: z.string().email().nullable(),
  phone: z.string().nullable(),
  address: z.string().nullable(),
  created_at: z.coerce.date()
});

export type Customer = z.infer<typeof customerSchema>;

// Product schema
export const productSchema = z.object({
  id: z.number(),
  code: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  purchase_price: z.number(),
  selling_price: z.number(),
  stock_quantity: z.number().int(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Product = z.infer<typeof productSchema>;

// Transaction type enum
export const transactionTypeSchema = z.enum(['IN', 'OUT']);
export type TransactionType = z.infer<typeof transactionTypeSchema>;

// Transaction schema
export const transactionSchema = z.object({
  id: z.number(),
  product_id: z.number(),
  type: transactionTypeSchema,
  quantity: z.number().int(),
  reference: z.string().nullable(),
  notes: z.string().nullable(),
  created_at: z.coerce.date()
});

export type Transaction = z.infer<typeof transactionSchema>;

// Input schemas for creating/updating entities

export const createSupplierInputSchema = z.object({
  name: z.string(),
  contact: z.string().nullable(),
  email: z.string().email().nullable(),
  phone: z.string().nullable(),
  address: z.string().nullable()
});

export type CreateSupplierInput = z.infer<typeof createSupplierInputSchema>;

export const updateSupplierInputSchema = z.object({
  id: z.number(),
  name: z.string().optional(),
  contact: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  phone: z.string().nullable().optional(),
  address: z.string().nullable().optional()
});

export type UpdateSupplierInput = z.infer<typeof updateSupplierInputSchema>;

export const createCustomerInputSchema = z.object({
  name: z.string(),
  contact: z.string().nullable(),
  email: z.string().email().nullable(),
  phone: z.string().nullable(),
  address: z.string().nullable()
});

export type CreateCustomerInput = z.infer<typeof createCustomerInputSchema>;

export const updateCustomerInputSchema = z.object({
  id: z.number(),
  name: z.string().optional(),
  contact: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  phone: z.string().nullable().optional(),
  address: z.string().nullable().optional()
});

export type UpdateCustomerInput = z.infer<typeof updateCustomerInputSchema>;

export const createProductInputSchema = z.object({
  code: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  purchase_price: z.number().nonnegative(),
  selling_price: z.number().nonnegative(),
  stock_quantity: z.number().int().nonnegative()
});

export type CreateProductInput = z.infer<typeof createProductInputSchema>;

export const updateProductInputSchema = z.object({
  id: z.number(),
  code: z.string().optional(),
  name: z.string().optional(),
  description: z.string().nullable().optional(),
  purchase_price: z.number().nonnegative().optional(),
  selling_price: z.number().nonnegative().optional(),
  stock_quantity: z.number().int().nonnegative().optional()
});

export type UpdateProductInput = z.infer<typeof updateProductInputSchema>;

export const createTransactionInputSchema = z.object({
  product_id: z.number(),
  type: transactionTypeSchema,
  quantity: z.number().int().positive(),
  reference: z.string().nullable(),
  notes: z.string().nullable()
});

export type CreateTransactionInput = z.infer<typeof createTransactionInputSchema>;
