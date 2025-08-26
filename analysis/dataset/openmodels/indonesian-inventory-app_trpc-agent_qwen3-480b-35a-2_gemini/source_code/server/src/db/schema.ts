import { serial, text, pgTable, timestamp, integer, numeric } from 'drizzle-orm/pg-core';

export const itemsTable = pgTable('items', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  code: text('code').notNull(),
  description: text('description'),
  stock: integer('stock').notNull().default(0),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

export const transactionsTable = pgTable('transactions', {
  id: serial('id').primaryKey(),
  item_id: integer('item_id').notNull().references(() => itemsTable.id),
  type: text('type', { enum: ['in', 'out'] }).notNull(),
  quantity: integer('quantity').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull()
});

// TypeScript types for the table schemas
export type Item = typeof itemsTable.$inferSelect;
export type NewItem = typeof itemsTable.$inferInsert;

export type Transaction = typeof transactionsTable.$inferSelect;
export type NewTransaction = typeof transactionsTable.$inferInsert;

// Export all tables for relation queries
export const tables = { items: itemsTable, transactions: transactionsTable };
