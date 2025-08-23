import { pgTable, serial, text, integer, timestamp } from 'drizzle-orm/pg-core';

// Products table
export const productsTable = pgTable('products', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  sku: text('sku').notNull().unique(),
  stock_quantity: integer('stock_quantity').notNull().default(0),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Stock-in transactions table
export const stockInTable = pgTable('stock_in', {
  id: serial('id').primaryKey(),
  product_id: integer('product_id')
    .notNull()
    .references(() => productsTable.id),
  quantity: integer('quantity').notNull(),
  transaction_date: timestamp('transaction_date').defaultNow().notNull(),
});

// Stock-out transactions table
export const stockOutTable = pgTable('stock_out', {
  id: serial('id').primaryKey(),
  product_id: integer('product_id')
    .notNull()
    .references(() => productsTable.id),
  quantity: integer('quantity').notNull(),
  transaction_date: timestamp('transaction_date').defaultNow().notNull(),
});

// Export all tables for relation queries
export const tables = {
  products: productsTable,
  stockIn: stockInTable,
  stockOut: stockOutTable,
};

// Types for convenience
export type Product = typeof productsTable.$inferSelect;
export type NewProduct = typeof productsTable.$inferInsert;
export type StockIn = typeof stockInTable.$inferSelect;
export type NewStockIn = typeof stockInTable.$inferInsert;
export type StockOut = typeof stockOutTable.$inferSelect;
export type NewStockOut = typeof stockOutTable.$inferInsert;
