import { serial, text, pgTable, timestamp, integer, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Define transaction type enum
export const transactionTypeEnum = pgEnum('transaction_type', ['stock_in', 'stock_out']);

// Products table
export const productsTable = pgTable('products', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  sku: text('sku').notNull().unique(), // SKU should be unique
  stock_level: integer('stock_level').notNull().default(0),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Stock transactions table
export const transactionsTable = pgTable('transactions', {
  id: serial('id').primaryKey(),
  product_id: integer('product_id').notNull().references(() => productsTable.id, { onDelete: 'cascade' }),
  type: transactionTypeEnum('type').notNull(),
  quantity: integer('quantity').notNull(),
  notes: text('notes'), // Nullable field for optional transaction notes
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Define relations
export const productsRelations = relations(productsTable, ({ many }) => ({
  transactions: many(transactionsTable),
}));

export const transactionsRelations = relations(transactionsTable, ({ one }) => ({
  product: one(productsTable, {
    fields: [transactionsTable.product_id],
    references: [productsTable.id],
  }),
}));

// TypeScript types for the table schemas
export type Product = typeof productsTable.$inferSelect;
export type NewProduct = typeof productsTable.$inferInsert;
export type Transaction = typeof transactionsTable.$inferSelect;
export type NewTransaction = typeof transactionsTable.$inferInsert;

// Export all tables and relations for proper query building
export const tables = { 
  products: productsTable, 
  transactions: transactionsTable 
};

export const tableRelations = {
  productsRelations,
  transactionsRelations
};
