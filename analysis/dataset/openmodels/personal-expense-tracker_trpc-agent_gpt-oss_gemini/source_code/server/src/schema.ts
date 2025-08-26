import { z } from 'zod';

// ---------- Enums ----------
export const transactionTypeEnum = z.enum(['income', 'expense']);
export type TransactionType = z.infer<typeof transactionTypeEnum>;

// ---------- Category Schemas ----------
export const categorySchema = z.object({
  id: z.number(),
  name: z.string(),
  created_at: z.coerce.date(),
});
export type Category = z.infer<typeof categorySchema>;

export const createCategoryInputSchema = z.object({
  name: z.string(),
});
export type CreateCategoryInput = z.infer<typeof createCategoryInputSchema>;

// ---------- Transaction Schemas ----------
export const transactionSchema = z.object({
  id: z.number(),
  amount: z.number(), // Stored as numeric, but we use number in TS
  type: transactionTypeEnum,
  category_id: z.number(),
  description: z.string().nullable(),
  transaction_date: z.coerce.date(),
  created_at: z.coerce.date(),
});
export type Transaction = z.infer<typeof transactionSchema>;

export const createTransactionInputSchema = z.object({
  amount: z.number().positive(), // Positive amount for both income and expense; type differentiates sign
  type: transactionTypeEnum,
  category_id: z.number(),
  description: z.string().nullable().optional(),
  transaction_date: z.coerce.date().optional(),
});
export type CreateTransactionInput = z.infer<typeof createTransactionInputSchema>;

export const updateTransactionInputSchema = z.object({
  id: z.number(),
  amount: z.number().positive().optional(),
  type: transactionTypeEnum.optional(),
  category_id: z.number().optional(),
  description: z.string().nullable().optional(),
  transaction_date: z.coerce.date().optional(),
});
export type UpdateTransactionInput = z.infer<typeof updateTransactionInputSchema>;

// ---------- Budget Schemas ----------
export const budgetSchema = z.object({
  id: z.number(),
  category_id: z.number(),
  amount: z.number(), // Monthly budget amount
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000),
  created_at: z.coerce.date(),
});
export type Budget = z.infer<typeof budgetSchema>;

export const createBudgetInputSchema = z.object({
  category_id: z.number(),
  amount: z.number().positive(),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000),
});
export type CreateBudgetInput = z.infer<typeof createBudgetInputSchema>;
