import { serial, text, pgTable, timestamp, numeric, integer, date, primaryKey } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Define enums
export const transactionTypeEnum = ['income', 'expense'] as const;
export const categoryTypeEnum = ['income', 'expense'] as const;

// Categories table
export const categoriesTable = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type', { enum: categoryTypeEnum }).notNull(), // 'income' or 'expense'
});

// Transactions table
export const transactionsTable = pgTable('transactions', {
  id: serial('id').primaryKey(),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  type: text('type', { enum: transactionTypeEnum }).notNull(), // 'income' or 'expense'
  description: text('description'),
  date: date('date').notNull(),
  categoryId: integer('category_id').notNull().references(() => categoriesTable.id),
});

// Budgets table
export const budgetsTable = pgTable('budgets', {
  id: serial('id').primaryKey(),
  categoryId: integer('category_id').notNull().references(() => categoriesTable.id),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  month: integer('month').notNull(), // 1-12
  year: integer('year').notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.categoryId, table.month, table.year] })
}));

// Relations
export const categoriesRelations = relations(categoriesTable, ({ many }) => ({
  transactions: many(transactionsTable),
  budgets: many(budgetsTable),
}));

export const transactionsRelations = relations(transactionsTable, ({ one }) => ({
  category: one(categoriesTable, {
    fields: [transactionsTable.categoryId],
    references: [categoriesTable.id],
  }),
}));

export const budgetsRelations = relations(budgetsTable, ({ one }) => ({
  category: one(categoriesTable, {
    fields: [budgetsTable.categoryId],
    references: [categoriesTable.id],
  }),
}));

// TypeScript types for the table schemas
export type Category = typeof categoriesTable.$inferSelect;
export type NewCategory = typeof categoriesTable.$inferInsert;

export type Transaction = typeof transactionsTable.$inferSelect;
export type NewTransaction = typeof transactionsTable.$inferInsert;

export type Budget = typeof budgetsTable.$inferSelect;
export type NewBudget = typeof budgetsTable.$inferInsert;

// Export all tables and relations for proper query building
export const tables = { categories: categoriesTable, transactions: transactionsTable, budgets: budgetsTable };
export const allRelations = { categoriesRelations, transactionsRelations, budgetsRelations };
