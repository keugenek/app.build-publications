import { pgTable, serial, numeric, text, timestamp } from 'drizzle-orm/pg-core';
import { pgEnum } from 'drizzle-orm/pg-core';

// Define enum for currencies in DB
export const currencyEnum = pgEnum('currency', [
  'USD',
  'EUR',
  'GBP',
  'JPY',
  'CAD',
  'AUD',
  'CHF',
  'CNY',
  'SEK',
  'NZD',
]);

export const conversionsTable = pgTable('conversions', {
  id: serial('id').primaryKey(),
  amount: numeric('amount', { precision: 20, scale: 6 }).notNull(), // store as numeric for precision
  source_currency: currencyEnum('source_currency').notNull(),
  target_currency: currencyEnum('target_currency').notNull(),
  converted_amount: numeric('converted_amount', { precision: 20, scale: 6 }).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export type Conversion = typeof conversionsTable.$inferSelect;
export type NewConversion = typeof conversionsTable.$inferInsert;

export const tables = { conversions: conversionsTable };
