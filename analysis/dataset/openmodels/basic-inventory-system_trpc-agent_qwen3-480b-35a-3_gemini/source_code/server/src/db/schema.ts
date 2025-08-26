import { serial, text, pgTable, timestamp, integer } from 'drizzle-orm/pg-core';

// Product table
export const productsTable = pgTable('products', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  sku: text('sku').notNull().unique(),
  stockLevel: integer('stock_level').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Stock transaction table
export const stockTransactionsTable = pgTable('stock_transactions', {
  id: serial('id').primaryKey(),
  productId: integer('product_id').notNull().references(() => productsTable.id),
  quantity: integer('quantity').notNull(),
  transactionType: text('transaction_type', { enum: ['STOCK_IN', 'STOCK_OUT'] }).notNull(),
  transactionDate: timestamp('transaction_date').defaultNow().notNull(),
});

// TypeScript types for the table schemas
export type Product = typeof productsTable.$inferSelect;
export type NewProduct = typeof productsTable.$inferInsert;

export type StockTransaction = typeof stockTransactionsTable.$inferSelect;
export type NewStockTransaction = typeof stockTransactionsTable.$inferInsert;

// Export all tables for relation queries
export const tables = { products: productsTable, stockTransactions: stockTransactionsTable };
