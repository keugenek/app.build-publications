import { serial, text, pgTable, timestamp, integer } from 'drizzle-orm/pg-core';

export const productsTable = pgTable('products', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  sku: text('sku').notNull().unique(),
  stock_quantity: integer('stock_quantity').notNull().default(0),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

export const stockTransactionsTable = pgTable('stock_transactions', {
  id: serial('id').primaryKey(),
  product_id: integer('product_id').notNull().references(() => productsTable.id),
  transaction_type: text('transaction_type', { enum: ['IN', 'OUT'] }).notNull(),
  quantity: integer('quantity').notNull(),
  notes: text('notes'),
  created_at: timestamp('created_at').defaultNow().notNull()
});

// TypeScript types for the table schemas
export type Product = typeof productsTable.$inferSelect;
export type NewProduct = typeof productsTable.$inferInsert;

export type StockTransaction = typeof stockTransactionsTable.$inferSelect;
export type NewStockTransaction = typeof stockTransactionsTable.$inferInsert;

// Export all tables for relation queries
export const tables = { products: productsTable, stockTransactions: stockTransactionsTable };
