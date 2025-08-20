import { serial, text, pgTable, timestamp, integer, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Define transaction type enum
export const transactionTypeEnum = pgEnum('transaction_type', ['STOCK_IN', 'STOCK_OUT']);

// Products table
export const productsTable = pgTable('products', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  sku: text('sku').notNull().unique(), // SKU should be unique
  description: text('description'), // Nullable by default
  stock_level: integer('stock_level').notNull().default(0), // Current stock level
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Stock transactions table
export const stockTransactionsTable = pgTable('stock_transactions', {
  id: serial('id').primaryKey(),
  product_id: integer('product_id').notNull().references(() => productsTable.id, { onDelete: 'cascade' }),
  transaction_type: transactionTypeEnum('transaction_type').notNull(),
  quantity: integer('quantity').notNull(), // Quantity of stock moved
  notes: text('notes'), // Optional notes about the transaction
  created_at: timestamp('created_at').defaultNow().notNull()
});

// Define relations
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
