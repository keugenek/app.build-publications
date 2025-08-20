import { z } from 'zod';

// Define the transaction type enum
export const transactionTypeSchema = z.enum(['income', 'expense']);
export type TransactionType = z.infer<typeof transactionTypeSchema>;

// Define the category enum
export const categorySchema = z.enum([
  'Food', 
  'Transport', 
  'Utilities', 
  'Salary', 
  'Entertainment', 
  'Healthcare', 
  'Shopping', 
  'Other'
]);
export type Category = z.infer<typeof categorySchema>;

// Transaction schema
export const transactionSchema = z.object({
  id: z.number(),
  amount: z.number(),
  date: z.coerce.date(),
  description: z.string().nullable(),
  type: transactionTypeSchema,
  category: categorySchema,
  created_at: z.coerce.date(),
});

export type Transaction = z.infer<typeof transactionSchema>;

// Input schema for creating transactions
export const createTransactionInputSchema = z.object({
  amount: z.number().positive(),
  date: z.coerce.date(),
  description: z.string().nullable(),
  type: transactionTypeSchema,
  category: categorySchema,
});

export type CreateTransactionInput = z.infer<typeof createTransactionInputSchema>;

// Input schema for updating transactions
export const updateTransactionInputSchema = z.object({
  id: z.number(),
  amount: z.number().positive().optional(),
  date: z.coerce.date().optional(),
  description: z.string().nullable().optional(),
  type: transactionTypeSchema.optional(),
  category: categorySchema.optional(),
});

export type UpdateTransactionInput = z.infer<typeof updateTransactionInputSchema>;

// Budget schema
export const budgetSchema = z.object({
  id: z.number(),
  category: categorySchema,
  amount: z.number(),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000).max(2100),
  created_at: z.coerce.date(),
});

export type Budget = z.infer<typeof budgetSchema>;

// Input schema for creating budgets
export const createBudgetInputSchema = z.object({
  category: categorySchema,
  amount: z.number().positive(),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000).max(2100),
});

export type CreateBudgetInput = z.infer<typeof createBudgetInputSchema>;

// Input schema for updating budgets
export const updateBudgetInputSchema = z.object({
  id: z.number(),
  category: categorySchema.optional(),
  amount: z.number().positive().optional(),
  month: z.number().int().min(1).max(12).optional(),
  year: z.number().int().min(2000).max(2100).optional(),
});

export type UpdateBudgetInput = z.infer<typeof updateBudgetInputSchema>;
