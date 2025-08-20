import { z } from 'zod';

// Predefined category names
export const predefinedCategoryNames = [
  'Food',
  'Transport', 
  'Housing',
  'Entertainment',
  'Utilities'
] as const;

// Transaction type enum
export const transactionTypeEnum = z.enum(['income', 'expense']);
export type TransactionType = z.infer<typeof transactionTypeEnum>;

// Category schema
export const categorySchema = z.object({
  id: z.number(),
  name: z.string(),
  is_predefined: z.boolean(),
  created_at: z.coerce.date()
});

export type Category = z.infer<typeof categorySchema>;

// Input schema for creating categories
export const createCategoryInputSchema = z.object({
  name: z.string().min(1, 'Category name is required')
});

export type CreateCategoryInput = z.infer<typeof createCategoryInputSchema>;

// Transaction schema
export const transactionSchema = z.object({
  id: z.number(),
  type: transactionTypeEnum,
  amount: z.number().positive(),
  description: z.string(),
  date: z.coerce.date(),
  category_id: z.number().nullable(),
  created_at: z.coerce.date()
});

export type Transaction = z.infer<typeof transactionSchema>;

// Input schema for creating transactions
export const createTransactionInputSchema = z.object({
  type: transactionTypeEnum,
  amount: z.number().positive('Amount must be positive'),
  description: z.string().min(1, 'Description is required'),
  date: z.coerce.date(),
  category_id: z.number().nullable()
});

export type CreateTransactionInput = z.infer<typeof createTransactionInputSchema>;

// Input schema for updating transactions
export const updateTransactionInputSchema = z.object({
  id: z.number(),
  type: transactionTypeEnum.optional(),
  amount: z.number().positive().optional(),
  description: z.string().min(1).optional(),
  date: z.coerce.date().optional(),
  category_id: z.number().nullable().optional()
});

export type UpdateTransactionInput = z.infer<typeof updateTransactionInputSchema>;

// Budget schema
export const budgetSchema = z.object({
  id: z.number(),
  category_id: z.number(),
  monthly_limit: z.number().positive(),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000),
  created_at: z.coerce.date()
});

export type Budget = z.infer<typeof budgetSchema>;

// Input schema for creating budgets
export const createBudgetInputSchema = z.object({
  category_id: z.number(),
  monthly_limit: z.number().positive('Monthly limit must be positive'),
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

// Dashboard data schemas
export const categorySpendingSchema = z.object({
  category_id: z.number().nullable(),
  category_name: z.string().nullable(),
  total_amount: z.number()
});

export type CategorySpending = z.infer<typeof categorySpendingSchema>;

export const monthlyOverviewSchema = z.object({
  month: z.number().int(),
  year: z.number().int(),
  total_income: z.number(),
  total_expenses: z.number(),
  net_amount: z.number()
});

export type MonthlyOverview = z.infer<typeof monthlyOverviewSchema>;

export const dashboardDataSchema = z.object({
  category_spending: z.array(categorySpendingSchema),
  monthly_overview: z.array(monthlyOverviewSchema),
  current_month_budgets: z.array(budgetSchema.extend({
    category_name: z.string(),
    spent_amount: z.number()
  }))
});

export type DashboardData = z.infer<typeof dashboardDataSchema>;

// Query parameters for filtering
export const transactionFiltersSchema = z.object({
  type: transactionTypeEnum.optional(),
  category_id: z.number().optional(),
  start_date: z.coerce.date().optional(),
  end_date: z.coerce.date().optional(),
  limit: z.number().int().positive().optional(),
  offset: z.number().int().nonnegative().optional()
});

export type TransactionFilters = z.infer<typeof transactionFiltersSchema>;

export const dashboardFiltersSchema = z.object({
  year: z.number().int().min(2000).optional(),
  months: z.number().int().min(1).max(12).optional()
});

export type DashboardFilters = z.infer<typeof dashboardFiltersSchema>;
