import { serial, text, pgTable, timestamp, numeric, integer, date } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// Transactions table
export const transactionsTable = pgTable('transactions', {
  id: serial('id').primaryKey(),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  date: date('date').notNull(),
  description: text('description'),
  type: text('type', { enum: ['income', 'expense'] }).notNull(),
  category: text('category', { enum: ['Food', 'Transport', 'Utilities', 'Salary', 'Entertainment', 'Healthcare', 'Shopping', 'Other'] }).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Budgets table
export const budgetsTable = pgTable('budgets', {
  id: serial('id').primaryKey(),
  category: text('category', { enum: ['Food', 'Transport', 'Utilities', 'Salary', 'Entertainment', 'Healthcare', 'Shopping', 'Other'] }).notNull(),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  month: integer('month').notNull(),
  year: integer('year').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// TypeScript types for the table schemas
export type Transaction = typeof transactionsTable.$inferSelect;
export type NewTransaction = typeof transactionsTable.$inferInsert;

export type Budget = typeof budgetsTable.$inferSelect;
export type NewBudget = typeof budgetsTable.$inferInsert;

// Export all tables for relation queries
export const tables = { transactions: transactionsTable, budgets: budgetsTable };
