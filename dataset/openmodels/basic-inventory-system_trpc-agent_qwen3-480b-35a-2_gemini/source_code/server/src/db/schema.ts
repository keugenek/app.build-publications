import { serial, text, pgTable, timestamp, integer } from 'drizzle-orm/pg-core';

// Products table
export const productsTable = pgTable('products', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  sku: text('sku').notNull().unique(),
  stock_level: integer('stock_level').notNull().default(0),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Transactions table
export const transactionsTable = pgTable('transactions', {
  id: serial('id').primaryKey(),
  product_sku: text('product_sku').notNull(),
  transaction_type: text('transaction_type', { enum: ['stock-in', 'stock-out'] }).notNull(),
  quantity: integer('quantity').notNull(),
  transaction_date: timestamp('transaction_date').defaultNow().notNull(),
  created_at: timestamp('created_at').defaultNow().notNull()
});

// TypeScript types for the table schemas
export type Product = typeof productsTable.$inferSelect;
export type NewProduct = typeof productsTable.$inferInsert;

export type Transaction = typeof transactionsTable.$inferSelect;
export type NewTransaction = typeof transactionsTable.$inferInsert;

// Export all tables for relation queries
export const tables = { products: productsTable, transactions: transactionsTable };
