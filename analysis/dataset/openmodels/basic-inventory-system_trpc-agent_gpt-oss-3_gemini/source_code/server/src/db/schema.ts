import { pgTable, serial, text, integer, timestamp, pgEnum } from 'drizzle-orm/pg-core';

// Transaction type enum in DB
export const transactionTypeEnum = pgEnum('transaction_type', ['stock_in', 'stock_out'] as const);

export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  sku: text('sku').notNull().unique(),
  stock_quantity: integer('stock_quantity').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const stock_transactions = pgTable('stock_transactions', {
  id: serial('id').primaryKey(),
  product_id: integer('product_id')
    .notNull()
    .references(() => products.id),
  type: transactionTypeEnum('type').notNull(),
  quantity: integer('quantity').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Export types for SELECT and INSERT operations
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;

export type StockTransaction = typeof stock_transactions.$inferSelect;
export type NewStockTransaction = typeof stock_transactions.$inferInsert;

// Export tables collection for drizzle initialization
export const tables = {
  products,
  stock_transactions,
};
