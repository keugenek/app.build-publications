import { pgTable, varchar, numeric, timestamp, serial, uniqueIndex } from 'drizzle-orm/pg-core';

// Currencies table
export const currenciesTable = pgTable('currencies', {
  code: varchar('code', { length: 3 }).primaryKey(), // ISO 4217 currency code
  name: varchar('name', { length: 255 }).notNull(),
  symbol: varchar('symbol', { length: 10 }).notNull(),
});

// Conversion history table
export const conversionHistoryTable = pgTable('conversion_history', {
  id: serial('id').primaryKey(),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  fromCurrency: varchar('from_currency', { length: 3 }).notNull(),
  toCurrency: varchar('to_currency', { length: 3 }).notNull(),
  convertedAmount: numeric('converted_amount', { precision: 12, scale: 2 }).notNull(),
  exchangeRate: numeric('exchange_rate', { precision: 12, scale: 6 }).notNull(),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
}, (table) => {
  return {
    fromToIdx: uniqueIndex('from_to_idx').on(table.fromCurrency, table.toCurrency),
  };
});

// TypeScript types
export type Currency = typeof currenciesTable.$inferSelect;
export type NewCurrency = typeof currenciesTable.$inferInsert;

export type ConversionHistory = typeof conversionHistoryTable.$inferSelect;
export type NewConversionHistory = typeof conversionHistoryTable.$inferInsert;

// Export all tables for relation queries
export const tables = { currencies: currenciesTable, conversionHistory: conversionHistoryTable };
