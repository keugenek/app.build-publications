import { z } from 'zod';

// Transaction type enum
export const transactionTypeSchema = z.enum(['income', 'expense']);
export type TransactionType = z.infer<typeof transactionTypeSchema>;

// Category schema
export const categorySchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  created_at: z.coerce.date()
});

export type Category = z.infer<typeof categorySchema>;

// Input schema for creating categories
export const createCategoryInputSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable()
});

export type CreateCategoryInput = z.infer<typeof createCategoryInputSchema>;

// Transaction schema
export const transactionSchema = z.object({
  id: z.number(),
  description: z.string(),
  amount: z.number(),
  type: transactionTypeSchema,
  category_id: z.number().nullable(),
  transaction_date: z.coerce.date(),
  created_at: z.coerce.date()
});

export type Transaction = z.infer<typeof transactionSchema>;

// Input schema for creating transactions
export const createTransactionInputSchema = z.object({
  description: z.string().min(1),
  amount: z.number().positive(),
  type: transactionTypeSchema,
  category_id: z.number().nullable(),
  transaction_date: z.coerce.date()
});

export type CreateTransactionInput = z.infer<typeof createTransactionInputSchema>;

// Budget schema
export const budgetSchema = z.object({
  id: z.number(),
  category_id: z.number(),
  amount: z.number(),
  month: z.number().int().min(1).max(12),
  year: z.number().int(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Budget = z.infer<typeof budgetSchema>;

// Input schema for creating/updating budgets
export const createBudgetInputSchema = z.object({
  category_id: z.number(),
  amount: z.number().positive(),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000)
});

export type CreateBudgetInput = z.infer<typeof createBudgetInputSchema>;

// Filter schemas for queries
export const transactionFilterSchema = z.object({
  category_id: z.number().nullable().optional(),
  start_date: z.coerce.date().optional(),
  end_date: z.coerce.date().optional(),
  type: transactionTypeSchema.optional()
});

export type TransactionFilter = z.infer<typeof transactionFilterSchema>;

// Summary schemas for dashboard
export const spendingByCategorySchema = z.object({
  category_id: z.number().nullable(),
  category_name: z.string().nullable(),
  total_amount: z.number(),
  transaction_count: z.number()
});

export type SpendingByCategory = z.infer<typeof spendingByCategorySchema>;

export const spendingTrendSchema = z.object({
  date: z.string(), // Format: YYYY-MM-DD
  total_income: z.number(),
  total_expense: z.number(),
  net_amount: z.number()
});

export type SpendingTrend = z.infer<typeof spendingTrendSchema>;

export const financialSummarySchema = z.object({
  total_income: z.number(),
  total_expense: z.number(),
  net_balance: z.number(),
  start_date: z.coerce.date(),
  end_date: z.coerce.date()
});

export type FinancialSummary = z.infer<typeof financialSummarySchema>;

// Date range input schema
export const dateRangeSchema = z.object({
  start_date: z.coerce.date(),
  end_date: z.coerce.date()
});

export type DateRange = z.infer<typeof dateRangeSchema>;
