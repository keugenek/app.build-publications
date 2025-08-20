import { z } from 'zod';

// Transaction type enum
export const transactionTypeSchema = z.enum(['income', 'expense']);
export type TransactionType = z.infer<typeof transactionTypeSchema>;

// Category schema
export const categorySchema = z.object({
  id: z.number(),
  name: z.string(),
  color: z.string().nullable(), // Optional hex color for visualization
  created_at: z.coerce.date()
});

export type Category = z.infer<typeof categorySchema>;

// Input schema for creating categories
export const createCategoryInputSchema = z.object({
  name: z.string().min(1, "Category name is required"),
  color: z.string().nullable().optional() // Hex color code
});

export type CreateCategoryInput = z.infer<typeof createCategoryInputSchema>;

// Input schema for updating categories
export const updateCategoryInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1, "Category name is required").optional(),
  color: z.string().nullable().optional()
});

export type UpdateCategoryInput = z.infer<typeof updateCategoryInputSchema>;

// Transaction schema
export const transactionSchema = z.object({
  id: z.number(),
  amount: z.number(), // Stored as numeric in DB
  date: z.coerce.date(),
  description: z.string(),
  type: transactionTypeSchema,
  category_id: z.number(),
  created_at: z.coerce.date()
});

export type Transaction = z.infer<typeof transactionSchema>;

// Input schema for creating transactions
export const createTransactionInputSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  date: z.coerce.date(),
  description: z.string().min(1, "Description is required"),
  type: transactionTypeSchema,
  category_id: z.number()
});

export type CreateTransactionInput = z.infer<typeof createTransactionInputSchema>;

// Input schema for updating transactions
export const updateTransactionInputSchema = z.object({
  id: z.number(),
  amount: z.number().positive("Amount must be positive").optional(),
  date: z.coerce.date().optional(),
  description: z.string().min(1, "Description is required").optional(),
  type: transactionTypeSchema.optional(),
  category_id: z.number().optional()
});

export type UpdateTransactionInput = z.infer<typeof updateTransactionInputSchema>;

// Budget schema
export const budgetSchema = z.object({
  id: z.number(),
  category_id: z.number(),
  amount: z.number(), // Monthly budget amount
  month: z.number().int().min(1).max(12), // 1-12
  year: z.number().int().min(2000),
  created_at: z.coerce.date()
});

export type Budget = z.infer<typeof budgetSchema>;

// Input schema for creating budgets
export const createBudgetInputSchema = z.object({
  category_id: z.number(),
  amount: z.number().positive("Budget amount must be positive"),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000)
});

export type CreateBudgetInput = z.infer<typeof createBudgetInputSchema>;

// Input schema for updating budgets
export const updateBudgetInputSchema = z.object({
  id: z.number(),
  category_id: z.number().optional(),
  amount: z.number().positive("Budget amount must be positive").optional(),
  month: z.number().int().min(1).max(12).optional(),
  year: z.number().int().min(2000).optional()
});

export type UpdateBudgetInput = z.infer<typeof updateBudgetInputSchema>;

// Dashboard query schemas
export const dashboardQuerySchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional()
});

export type DashboardQuery = z.infer<typeof dashboardQuerySchema>;

// Dashboard response schemas
export const categorySpendingSchema = z.object({
  category_id: z.number(),
  category_name: z.string(),
  category_color: z.string().nullable(),
  total_amount: z.number(),
  transaction_count: z.number()
});

export type CategorySpending = z.infer<typeof categorySpendingSchema>;

export const spendingTrendSchema = z.object({
  date: z.string(), // YYYY-MM-DD format
  income: z.number(),
  expenses: z.number(),
  net: z.number()
});

export type SpendingTrend = z.infer<typeof spendingTrendSchema>;

export const dashboardDataSchema = z.object({
  categoryBreakdown: z.array(categorySpendingSchema),
  spendingTrends: z.array(spendingTrendSchema),
  totalIncome: z.number(),
  totalExpenses: z.number(),
  netAmount: z.number()
});

export type DashboardData = z.infer<typeof dashboardDataSchema>;
