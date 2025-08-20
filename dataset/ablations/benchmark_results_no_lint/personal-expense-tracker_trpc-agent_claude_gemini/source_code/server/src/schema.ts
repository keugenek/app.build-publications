import { z } from 'zod';

// Transaction type enum
export const transactionTypeSchema = z.enum(['income', 'expense']);
export type TransactionType = z.infer<typeof transactionTypeSchema>;

// Category schema
export const categorySchema = z.object({
  id: z.number(),
  name: z.string(),
  color: z.string().nullable(), // Hex color code for UI visualization
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Category = z.infer<typeof categorySchema>;

// Input schema for creating categories
export const createCategoryInputSchema = z.object({
  name: z.string().min(1, "Category name is required"),
  color: z.string().nullable().optional() // Optional color, can be null
});

export type CreateCategoryInput = z.infer<typeof createCategoryInputSchema>;

// Input schema for updating categories
export const updateCategoryInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  color: z.string().nullable().optional()
});

export type UpdateCategoryInput = z.infer<typeof updateCategoryInputSchema>;

// Transaction schema
export const transactionSchema = z.object({
  id: z.number(),
  amount: z.number().positive(), // Amount is always positive, type determines income/expense
  description: z.string(),
  type: transactionTypeSchema,
  category_id: z.number(),
  transaction_date: z.coerce.date(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Transaction = z.infer<typeof transactionSchema>;

// Input schema for creating transactions
export const createTransactionInputSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  description: z.string().min(1, "Description is required"),
  type: transactionTypeSchema,
  category_id: z.number(),
  transaction_date: z.coerce.date()
});

export type CreateTransactionInput = z.infer<typeof createTransactionInputSchema>;

// Input schema for updating transactions
export const updateTransactionInputSchema = z.object({
  id: z.number(),
  amount: z.number().positive().optional(),
  description: z.string().min(1).optional(),
  type: transactionTypeSchema.optional(),
  category_id: z.number().optional(),
  transaction_date: z.coerce.date().optional()
});

export type UpdateTransactionInput = z.infer<typeof updateTransactionInputSchema>;

// Budget schema
export const budgetSchema = z.object({
  id: z.number(),
  category_id: z.number(),
  monthly_limit: z.number().positive(),
  month: z.number().int().min(1).max(12), // Month as integer (1-12)
  year: z.number().int().min(2000), // Year as integer
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Budget = z.infer<typeof budgetSchema>;

// Input schema for creating budgets
export const createBudgetInputSchema = z.object({
  category_id: z.number(),
  monthly_limit: z.number().positive("Budget limit must be positive"),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000)
});

export type CreateBudgetInput = z.infer<typeof createBudgetInputSchema>;

// Input schema for updating budgets
export const updateBudgetInputSchema = z.object({
  id: z.number(),
  monthly_limit: z.number().positive().optional(),
  month: z.number().int().min(1).max(12).optional(),
  year: z.number().int().min(2000).optional()
});

export type UpdateBudgetInput = z.infer<typeof updateBudgetInputSchema>;

// Dashboard query schema
export const dashboardQuerySchema = z.object({
  start_date: z.coerce.date().optional(),
  end_date: z.coerce.date().optional(),
  month: z.number().int().min(1).max(12).optional(),
  year: z.number().int().min(2000).optional()
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

export const monthlyTrendSchema = z.object({
  month: z.number(),
  year: z.number(),
  total_income: z.number(),
  total_expenses: z.number(),
  net_amount: z.number()
});

export type MonthlyTrend = z.infer<typeof monthlyTrendSchema>;

export const dashboardDataSchema = z.object({
  category_spending: z.array(categorySpendingSchema),
  monthly_trends: z.array(monthlyTrendSchema),
  total_income: z.number(),
  total_expenses: z.number(),
  net_amount: z.number(),
  budget_status: z.array(z.object({
    category_id: z.number(),
    category_name: z.string(),
    budget_limit: z.number(),
    spent_amount: z.number(),
    remaining_amount: z.number(),
    percentage_used: z.number()
  }))
});

export type DashboardData = z.infer<typeof dashboardDataSchema>;
