import { text, pgTable, timestamp, numeric } from 'drizzle-orm/pg-core';

// Currencies table - stores available currencies
export const currenciesTable = pgTable('currencies', {
  code: text('code').primaryKey(), // ISO 4217 currency code
  name: text('name').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Conversion history table - stores conversion requests
export const conversionsTable = pgTable('conversions', {
  id: text('id').primaryKey(), // UUID
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  from_currency: text('from_currency').notNull(),
  to_currency: text('to_currency').notNull(),
  converted_amount: numeric('converted_amount', { precision: 12, scale: 2 }).notNull(),
  rate: numeric('rate', { precision: 12, scale: 6 }).notNull(),
  timestamp: timestamp('timestamp').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// TypeScript types for the tables
export type Currency = typeof currenciesTable.$inferSelect;
export type NewCurrency = typeof currenciesTable.$inferInsert;

export type Conversion = typeof conversionsTable.$inferSelect;
export type NewConversion = typeof conversionsTable.$inferInsert;

// Export all tables for relation queries
export const tables = { currencies: currenciesTable, conversions: conversionsTable };
