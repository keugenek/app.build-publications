import { pgTable, serial, text, numeric, integer, timestamp, pgEnum } from 'drizzle-orm/pg-core';

// Enum for unit (satuan)
export const unitEnum = pgEnum('unit', ['Pcs', 'Kotak'] as const);

// Enum for transaction type
export const transactionTypeEnum = pgEnum('transaction_type', ['masuk', 'keluar'] as const);

export const itemsTable = pgTable('items', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  code: text('code').notNull(),
  description: text('description'), // nullable by default
  purchase_price: numeric('purchase_price', { precision: 12, scale: 2 }).notNull(),
  sale_price: numeric('sale_price', { precision: 12, scale: 2 }).notNull(),
  unit: unitEnum('unit').notNull(),
  stock: integer('stock').notNull().default(0),
  created_at: timestamp('created_at').defaultNow().notNull()
});

export const transactionsTable = pgTable('transactions', {
  id: serial('id').primaryKey(),
  item_id: integer('item_id')
    .notNull()
    .references(() => itemsTable.id),
  date: timestamp('date').defaultNow().notNull(),
  quantity: integer('quantity').notNull(),
  note: text('note'), // nullable
  type: transactionTypeEnum('type').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull()
});

// Types for SELECT and INSERT operations
export type Item = typeof itemsTable.$inferSelect;
export type NewItem = typeof itemsTable.$inferInsert;

export type Transaction = typeof transactionsTable.$inferSelect;
export type NewTransaction = typeof transactionsTable.$inferInsert;

// Export tables for relation queries
export const tables = {
  items: itemsTable,
  transactions: transactionsTable
};
