import { serial, text, pgTable, timestamp, numeric, date } from 'drizzle-orm/pg-core';

// Table to store currency conversion history
export const currencyConversionsTable = pgTable('currency_conversions', {
  id: serial('id').primaryKey(),
  amount: numeric('amount', { precision: 15, scale: 6 }).notNull(), // Original amount with high precision
  from_currency: text('from_currency').notNull(), // Source currency code (e.g., 'USD')
  to_currency: text('to_currency').notNull(), // Target currency code (e.g., 'EUR')
  exchange_rate: numeric('exchange_rate', { precision: 15, scale: 8 }).notNull(), // Exchange rate with high precision
  converted_amount: numeric('converted_amount', { precision: 15, scale: 6 }).notNull(), // Converted amount
  conversion_date: date('conversion_date').notNull(), // Date when the rate was valid
  created_at: timestamp('created_at').defaultNow().notNull(), // When the conversion was performed
});

// Table to cache exchange rates to reduce API calls (optional optimization)
export const exchangeRatesTable = pgTable('exchange_rates', {
  id: serial('id').primaryKey(),
  base_currency: text('base_currency').notNull(), // Base currency for the rate
  target_currency: text('target_currency').notNull(), // Target currency
  rate: numeric('rate', { precision: 15, scale: 8 }).notNull(), // Exchange rate
  rate_date: date('rate_date').notNull(), // Date the rate is valid for
  created_at: timestamp('created_at').defaultNow().notNull(), // When the rate was cached
});

// TypeScript types for the table schemas
export type CurrencyConversion = typeof currencyConversionsTable.$inferSelect; // For SELECT operations
export type NewCurrencyConversion = typeof currencyConversionsTable.$inferInsert; // For INSERT operations

export type ExchangeRateCache = typeof exchangeRatesTable.$inferSelect; // For SELECT operations
export type NewExchangeRateCache = typeof exchangeRatesTable.$inferInsert; // For INSERT operations

// Important: Export all tables and relations for proper query building
export const tables = { 
  currencyConversions: currencyConversionsTable,
  exchangeRates: exchangeRatesTable 
};
