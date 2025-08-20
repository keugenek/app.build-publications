import { pgTable, serial, text, timestamp, numeric, integer, pgEnum } from 'drizzle-orm/pg-core';

// ---------- Enums ----------
export const transactionTypeEnum = pgEnum('transaction_type', ['income', 'expense'] as const);

// ---------- Categories ----------
export const categoriesTable = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// ---------- Transactions ----------
export const transactionsTable = pgTable('transactions', {
  id: serial('id').primaryKey(),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(), // stored as numeric, will be parsed to number in app
  type: transactionTypeEnum('type').notNull(),
  category_id: integer('category_id')
    .notNull()
    .references(() => categoriesTable.id),
  description: text('description'), // nullable by default
  transaction_date: timestamp('transaction_date').defaultNow().notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// ---------- Budgets ----------
export const budgetsTable = pgTable('budgets', {
  id: serial('id').primaryKey(),
  category_id: integer('category_id')
    .notNull()
    .references(() => categoriesTable.id),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  month: integer('month').notNull(), // 1-12
  year: integer('year').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Export table types for SELECT/INSERT inference
export type Category = typeof categoriesTable.$inferSelect;
export type NewCategory = typeof categoriesTable.$inferInsert;

export type Transaction = typeof transactionsTable.$inferSelect;
export type NewTransaction = typeof transactionsTable.$inferInsert;

export type Budget = typeof budgetsTable.$inferSelect;
export type NewBudget = typeof budgetsTable.$inferInsert;

// Export all tables for relation queries
export const tables = {
  categories: categoriesTable,
  transactions: transactionsTable,
  budgets: budgetsTable,
};
