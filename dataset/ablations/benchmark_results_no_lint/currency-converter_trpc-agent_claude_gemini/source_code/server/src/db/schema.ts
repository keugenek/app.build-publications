import { serial, text, pgTable, timestamp, numeric, date, pgEnum } from 'drizzle-orm/pg-core';

// Define currency enum for PostgreSQL
export const currencyEnum = pgEnum('currency_code', [
  'USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'NZD', 'SEK', 'NOK', 'DKK'
]);

// Exchange rates table for storing historical exchange rate data
export const exchangeRatesTable = pgTable('exchange_rates', {
  id: serial('id').primaryKey(),
  from_currency: currencyEnum('from_currency').notNull(),
  to_currency: currencyEnum('to_currency').notNull(),
  rate: numeric('rate', { precision: 15, scale: 8 }).notNull(), // High precision for exchange rates
  date: date('date').notNull(), // Date of the exchange rate
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// TypeScript types for the table schema
export type ExchangeRate = typeof exchangeRatesTable.$inferSelect; // For SELECT operations
export type NewExchangeRate = typeof exchangeRatesTable.$inferInsert; // For INSERT operations

// Important: Export all tables and relations for proper query building
export const tables = { 
  exchangeRates: exchangeRatesTable 
};
