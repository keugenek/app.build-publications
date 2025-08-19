import { serial, text, pgTable, timestamp, numeric, integer, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Transaction type enum
export const transactionTypeEnum = pgEnum('transaction_type', ['income', 'expense']);

// Categories table
export const categoriesTable = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'), // Nullable by default
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Transactions table
export const transactionsTable = pgTable('transactions', {
  id: serial('id').primaryKey(),
  description: text('description').notNull(),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(), // Use numeric for monetary values
  type: transactionTypeEnum('type').notNull(),
  category_id: integer('category_id'), // Nullable foreign key
  transaction_date: timestamp('transaction_date').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Budgets table
export const budgetsTable = pgTable('budgets', {
  id: serial('id').primaryKey(),
  category_id: integer('category_id').notNull(),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  month: integer('month').notNull(), // 1-12
  year: integer('year').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Relations
export const categoriesRelations = relations(categoriesTable, ({ many }) => ({
  transactions: many(transactionsTable),
  budgets: many(budgetsTable),
}));

export const transactionsRelations = relations(transactionsTable, ({ one }) => ({
  category: one(categoriesTable, {
    fields: [transactionsTable.category_id],
    references: [categoriesTable.id],
  }),
}));

export const budgetsRelations = relations(budgetsTable, ({ one }) => ({
  category: one(categoriesTable, {
    fields: [budgetsTable.category_id],
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
export const tables = { 
  categories: categoriesTable, 
  transactions: transactionsTable,
  budgets: budgetsTable
};
