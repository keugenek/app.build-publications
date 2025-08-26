import { serial, text, pgTable, timestamp, numeric } from 'drizzle-orm/pg-core';

// Table to store currency conversion history
export const conversionsTable = pgTable('conversions', {
  id: serial('id').primaryKey(),
  amount: numeric('amount', { precision: 15, scale: 2 }).notNull(),
  from_currency: text('from_currency').notNull(),
  to_currency: text('to_currency').notNull(),
  exchange_rate: numeric('exchange_rate', { precision: 15, scale: 8 }).notNull(), // Higher precision for exchange rates
  converted_amount: numeric('converted_amount', { precision: 15, scale: 2 }).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// TypeScript types for the table schema
export type Conversion = typeof conversionsTable.$inferSelect; // For SELECT operations
export type NewConversion = typeof conversionsTable.$inferInsert; // For INSERT operations

// Important: Export all tables for proper query building
export const tables = { conversions: conversionsTable };
