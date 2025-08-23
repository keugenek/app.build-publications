import { z } from 'zod';

// Category schema
export const categorySchema = z.object({
  id: z.number(),
  name: z.string(),
  created_at: z.coerce.date(),
});

export type Category = z.infer<typeof categorySchema>;

// Budget schema
export const budgetSchema = z.object({
  id: z.number(),
  category_id: z.number(),
  amount: z.number().positive(),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000).max(2100),
  created_at: z.coerce.date(),
});

export type Budget = z.infer<typeof budgetSchema>;

// Transaction schema
export const transactionSchema = z.object({
  id: z.number(),
  category_id: z.number(),
  amount: z.number(),
  description: z.string().nullable(),
  date: z.coerce.date(),
  created_at: z.coerce.date(),
});

export type Transaction = z.infer<typeof transactionSchema>;

// Input schemas for creating entities
export const createCategoryInputSchema = z.object({
  name: z.string(),
});

export type CreateCategoryInput = z.infer<typeof createCategoryInputSchema>;

export const createBudgetInputSchema = z.object({
  category_id: z.number(),
  amount: z.number().positive(),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000).max(2100),
});

export type CreateBudgetInput = z.infer<typeof createBudgetInputSchema>;

export const createTransactionInputSchema = z.object({
  category_id: z.number(),
  amount: z.number(),
  description: z.string().nullable(),
  date: z.coerce.date(),
});

export type CreateTransactionInput = z.infer<typeof createTransactionInputSchema>;

// Input schemas for updating entities
export const updateCategoryInputSchema = z.object({
  id: z.number(),
  name: z.string().optional(),
});

export type UpdateCategoryInput = z.infer<typeof updateCategoryInputSchema>;

export const updateBudgetInputSchema = z.object({
  id: z.number(),
  category_id: z.number().optional(),
  amount: z.number().positive().optional(),
  month: z.number().int().min(1).max(12).optional(),
  year: z.number().int().min(2000).max(2100).optional(),
});

export type UpdateBudgetInput = z.infer<typeof updateBudgetInputSchema>;

export const updateTransactionInputSchema = z.object({
  id: z.number(),
  category_id: z.number().optional(),
  amount: z.number().optional(),
  description: z.string().nullable().optional(),
  date: z.coerce.date().optional(),
});

export type UpdateTransactionInput = z.infer<typeof updateTransactionInputSchema>;

// Dashboard data schemas
export const categorySpendingSchema = z.object({
  category_id: z.number(),
  category_name: z.string(),
  total_spent: z.number(),
  budget_amount: z.number().nullable(),
});

export type CategorySpending = z.infer<typeof categorySpendingSchema>;

export const monthlySpendingSchema = z.object({
  month: z.number(),
  year: z.number(),
  total_income: z.number(),
  total_expenses: z.number(),
});

export type MonthlySpending = z.infer<typeof monthlySpendingSchema>;
