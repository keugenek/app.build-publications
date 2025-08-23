import { z } from 'zod';

// Define enums
export const transactionTypeEnum = ['income', 'expense'] as const;
export const categoryTypeEnum = ['income', 'expense'] as const;

// Category schemas
export const categorySchema = z.object({
  id: z.number(),
  name: z.string(),
  type: z.enum(categoryTypeEnum),
});

export type Category = z.infer<typeof categorySchema>;

export const createCategoryInputSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(categoryTypeEnum),
});

export type CreateCategoryInput = z.infer<typeof createCategoryInputSchema>;

export const updateCategoryInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1, "Name is required").optional(),
  type: z.enum(categoryTypeEnum).optional(),
});

export type UpdateCategoryInput = z.infer<typeof updateCategoryInputSchema>;

// Transaction schemas
export const transactionSchema = z.object({
  id: z.number(),
  amount: z.number(),
  type: z.enum(transactionTypeEnum),
  description: z.string().nullable(),
  date: z.coerce.date(),
  categoryId: z.number(),
});

export type Transaction = z.infer<typeof transactionSchema>;

export const createTransactionInputSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  type: z.enum(transactionTypeEnum),
  description: z.string().nullable(),
  date: z.coerce.date(),
  categoryId: z.number(),
});

export type CreateTransactionInput = z.infer<typeof createTransactionInputSchema>;

export const updateTransactionInputSchema = z.object({
  id: z.number(),
  amount: z.number().positive("Amount must be positive").optional(),
  type: z.enum(transactionTypeEnum).optional(),
  description: z.string().nullable().optional(),
  date: z.coerce.date().optional(),
  categoryId: z.number().optional(),
});

export type UpdateTransactionInput = z.infer<typeof updateTransactionInputSchema>;

// Budget schemas
export const budgetSchema = z.object({
  id: z.number(),
  categoryId: z.number(),
  amount: z.number(),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(1900).max(2100),
});

export type Budget = z.infer<typeof budgetSchema>;

export const createBudgetInputSchema = z.object({
  categoryId: z.number(),
  amount: z.number().positive("Amount must be positive"),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(1900).max(2100),
});

export type CreateBudgetInput = z.infer<typeof createBudgetInputSchema>;

export const updateBudgetInputSchema = z.object({
  id: z.number(),
  categoryId: z.number().optional(),
  amount: z.number().positive("Amount must be positive").optional(),
  month: z.number().int().min(1).max(12).optional(),
  year: z.number().int().min(1900).max(2100).optional(),
});

export type UpdateBudgetInput = z.infer<typeof updateBudgetInputSchema>;

// Dashboard data schemas
export const categorySpendingSchema = z.object({
  categoryId: z.number(),
  categoryName: z.string(),
  amount: z.number(),
});

export type CategorySpending = z.infer<typeof categorySpendingSchema>;

export const monthlySpendingSchema = z.object({
  month: z.number(),
  year: z.number(),
  amount: z.number(),
});

export type MonthlySpending = z.infer<typeof monthlySpendingSchema>;

export const budgetStatusSchema = z.object({
  categoryId: z.number(),
  categoryName: z.string(),
  budgetedAmount: z.number(),
  spentAmount: z.number(),
  remainingAmount: z.number(),
  isOverBudget: z.boolean(),
});

export type BudgetStatus = z.infer<typeof budgetStatusSchema>;

export const dashboardDataSchema = z.object({
  categorySpending: z.array(categorySpendingSchema),
  monthlySpending: z.array(monthlySpendingSchema),
  budgetStatus: z.array(budgetStatusSchema),
});

export type DashboardData = z.infer<typeof dashboardDataSchema>;
