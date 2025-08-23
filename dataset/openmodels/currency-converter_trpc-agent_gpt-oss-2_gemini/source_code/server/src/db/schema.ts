import { pgEnum, pgTable, serial, numeric, timestamp, text } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// Define enum for supported currencies in the database
export const currencyEnum = pgEnum('currency', ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD'] as const);

export const conversionLogs = pgTable('conversion_logs', {
  id: serial('id').primaryKey(),
  amount: numeric('amount', { precision: 20, scale: 6 }).notNull(), // store original amount
  from: currencyEnum('from_currency').notNull(),
  to: currencyEnum('to_currency').notNull(),
  converted_amount: numeric('converted_amount', { precision: 20, scale: 6 }).notNull(),
  rate: numeric('rate', { precision: 20, scale: 6 }).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Types for SELECT and INSERT operations
export type ConversionLogRecord = typeof conversionLogs.$inferSelect;
export type NewConversionLog = typeof conversionLogs.$inferInsert;

// Export tables for relation queries
export const tables = { conversionLogs };
