import { serial, text, pgTable, timestamp, integer, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Transaction type enum
export const transactionTypeEnum = pgEnum('transaction_type', ['stock_in', 'stock_out']);

// Products table
export const productsTable = pgTable('products', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  sku: text('sku').notNull().unique(), // SKU should be unique across products
  stock_level: integer('stock_level').notNull().default(0),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Stock transactions table
export const stockTransactionsTable = pgTable('stock_transactions', {
  id: serial('id').primaryKey(),
  product_id: integer('product_id').notNull().references(() => productsTable.id),
  transaction_type: transactionTypeEnum('transaction_type').notNull(),
  quantity: integer('quantity').notNull(),
  notes: text('notes'), // Nullable by default
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const productsRelations = relations(productsTable, ({ many }) => ({
  transactions: many(stockTransactionsTable),
}));

export const stockTransactionsRelations = relations(stockTransactionsTable, ({ one }) => ({
  product: one(productsTable, {
    fields: [stockTransactionsTable.product_id],
    references: [productsTable.id],
  }),
}));

// TypeScript types for the table schemas
export type Product = typeof productsTable.$inferSelect;
export type NewProduct = typeof productsTable.$inferInsert;
export type StockTransaction = typeof stockTransactionsTable.$inferSelect;
export type NewStockTransaction = typeof stockTransactionsTable.$inferInsert;

// Export all tables and relations for proper query building
export const tables = { 
  products: productsTable, 
  stockTransactions: stockTransactionsTable 
};
