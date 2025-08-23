import { z } from 'zod';

// Enum for transaction type
export const transactionTypeEnum = z.enum(['income', 'expense']);
export type TransactionType = z.infer<typeof transactionTypeEnum>;

// Category schema
export const categorySchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
});
export type Category = z.infer<typeof categorySchema>;

// Budget schema (budget per category)
export const budgetSchema = z.object({
  id: z.number(),
  category_id: z.number(),
  amount: z.number(), // monetary value
});
export type Budget = z.infer<typeof budgetSchema>;

// Transaction schema
export const transactionSchema = z.object({
  id: z.number(),
  amount: z.number(),
  description: z.string().nullable(),
  date: z.coerce.date(),
  category_id: z.number(),
  type: transactionTypeEnum,
});
export type Transaction = z.infer<typeof transactionSchema>;

// Input schemas for creation
export const createCategoryInputSchema = z.object({
  name: z.string(),
  description: z.string().nullable().optional(),
});
export type CreateCategoryInput = z.infer<typeof createCategoryInputSchema>;

export const createBudgetInputSchema = z.object({
  category_id: z.number(),
  amount: z.number().positive(),
});
export type CreateBudgetInput = z.infer<typeof createBudgetInputSchema>;

export const createTransactionInputSchema = z.object({
  amount: z.number(),
  description: z.string().nullable().optional(),
  date: z.coerce.date(),
  category_id: z.number(),
  type: transactionTypeEnum,
});
export type CreateTransactionInput = z.infer<typeof createTransactionInputSchema>;

// Input schemas for updates (optional fields)
export const updateCategoryInputSchema = z.object({
  id: z.number(),
  name: z.string().optional(),
  description: z.string().nullable().optional(),
});
export type UpdateCategoryInput = z.infer<typeof updateCategoryInputSchema>;

export const updateBudgetInputSchema = z.object({
  id: z.number(),
  category_id: z.number().optional(),
  amount: z.number().positive().optional(),
});
export type UpdateBudgetInput = z.infer<typeof updateBudgetInputSchema>;

export const updateTransactionInputSchema = z.object({
  id: z.number(),
  amount: z.number().optional(),
  description: z.string().nullable().optional(),
  date: z.coerce.date().optional(),
  category_id: z.number().optional(),
  type: transactionTypeEnum.optional(),
});
export type UpdateTransactionInput = z.infer<typeof updateTransactionInputSchema>;
