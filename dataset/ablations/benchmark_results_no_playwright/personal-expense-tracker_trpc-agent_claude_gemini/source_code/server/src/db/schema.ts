import { serial, text, pgTable, timestamp, numeric, integer, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enum for transaction types
export const transactionTypeEnum = pgEnum('transaction_type', ['income', 'expense']);

// Categories table - both predefined and custom categories
export const categoriesTable = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  is_predefined: boolean('is_predefined').notNull().default(false),
  created_at: timestamp('created_at').defaultNow().notNull()
});

// Transactions table - income and expense records
export const transactionsTable = pgTable('transactions', {
  id: serial('id').primaryKey(),
  type: transactionTypeEnum('type').notNull(),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  description: text('description').notNull(),
  date: timestamp('date').notNull(),
  category_id: integer('category_id').references(() => categoriesTable.id),
  created_at: timestamp('created_at').defaultNow().notNull()
});

// Budgets table - monthly budget limits for categories
export const budgetsTable = pgTable('budgets', {
  id: serial('id').primaryKey(),
  category_id: integer('category_id').notNull().references(() => categoriesTable.id),
  monthly_limit: numeric('monthly_limit', { precision: 10, scale: 2 }).notNull(),
  month: integer('month').notNull(), // 1-12
  year: integer('year').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull()
});

// Define relations for better query capabilities
export const categoriesRelations = relations(categoriesTable, ({ many }) => ({
  transactions: many(transactionsTable),
  budgets: many(budgetsTable)
}));

export const transactionsRelations = relations(transactionsTable, ({ one }) => ({
  category: one(categoriesTable, {
    fields: [transactionsTable.category_id],
    references: [categoriesTable.id]
  })
}));

export const budgetsRelations = relations(budgetsTable, ({ one }) => ({
  category: one(categoriesTable, {
    fields: [budgetsTable.category_id],
    references: [categoriesTable.id]
  })
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

export const tableRelations = {
  categoriesRelations,
  transactionsRelations,
  budgetsRelations
};
