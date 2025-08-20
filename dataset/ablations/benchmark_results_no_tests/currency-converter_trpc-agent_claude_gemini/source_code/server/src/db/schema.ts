import { serial, text, pgTable, timestamp, numeric } from 'drizzle-orm/pg-core';

export const exchangeRatesTable = pgTable('exchange_rates', {
  id: serial('id').primaryKey(),
  from_currency: text('from_currency').notNull(), // 3-letter ISO currency code (e.g., USD)
  to_currency: text('to_currency').notNull(), // 3-letter ISO currency code (e.g., EUR)
  rate: numeric('rate', { precision: 15, scale: 8 }).notNull(), // High precision for exchange rates
  date: text('date').notNull(), // ISO date string from Frankfurter API
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// TypeScript types for the table schema
export type ExchangeRate = typeof exchangeRatesTable.$inferSelect; // For SELECT operations
export type NewExchangeRate = typeof exchangeRatesTable.$inferInsert; // For INSERT operations

// Important: Export all tables for proper query building
export const tables = { exchangeRates: exchangeRatesTable };
