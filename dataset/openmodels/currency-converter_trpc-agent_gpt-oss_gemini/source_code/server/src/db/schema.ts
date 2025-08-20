import { pgTable, serial, numeric, text, timestamp } from 'drizzle-orm/pg-core';

export const conversionsTable = pgTable('conversions', {
  id: serial('id').primaryKey(),
  amount: numeric('amount', { precision: 20, scale: 6 }).notNull(), // store original amount
  source_currency: text('source_currency').notNull(),
  target_currency: text('target_currency').notNull(),
  converted_amount: numeric('converted_amount', { precision: 20, scale: 6 }).notNull(),
  rate: numeric('rate', { precision: 20, scale: 6 }).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Types for query results
export type Conversion = typeof conversionsTable.$inferSelect;
export type NewConversion = typeof conversionsTable.$inferInsert;

export const tables = { conversions: conversionsTable };
