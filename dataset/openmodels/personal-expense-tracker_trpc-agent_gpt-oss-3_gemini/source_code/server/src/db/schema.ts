import { pgTable, serial, text, integer, numeric, timestamp, pgEnum } from 'drizzle-orm/pg-core';

// Enum for transaction type (income/expense)
export const transactionTypeEnum = pgEnum('transaction_type', ['income', 'expense'] as const);

export const categoriesTable = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'), // nullable by default
});

export const budgetsTable = pgTable('budgets', {
  id: serial('id').primaryKey(),
  category_id: integer('category_id')
    .notNull()
    .references(() => categoriesTable.id),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
});

export const transactionsTable = pgTable('transactions', {
  id: serial('id').primaryKey(),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  description: text('description'), // nullable
  date: timestamp('date').notNull(),
  category_id: integer('category_id')
    .notNull()
    .references(() => categoriesTable.id),
  type: transactionTypeEnum('type').notNull(),
});

// Infer Types for SELECT and INSERT
export type Category = typeof categoriesTable.$inferSelect;
export type NewCategory = typeof categoriesTable.$inferInsert;

export type Budget = typeof budgetsTable.$inferSelect;
export type NewBudget = typeof budgetsTable.$inferInsert;

export type Transaction = typeof transactionsTable.$inferSelect;
export type NewTransaction = typeof transactionsTable.$inferInsert;

// Export all tables for relation queries
export const tables = {
  categories: categoriesTable,
  budgets: budgetsTable,
  transactions: transactionsTable,
};
