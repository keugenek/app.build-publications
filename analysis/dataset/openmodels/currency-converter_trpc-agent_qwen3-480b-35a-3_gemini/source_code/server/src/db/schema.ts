import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';

// For this application, we don't need to store conversion data in the database
// But we'll define the schema structure for completeness and future extensions

export const currenciesTable = pgTable('currencies', {
  code: text('code').primaryKey(),
  name: text('name').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// TypeScript types for the table schemas
export type Currency = typeof currenciesTable.$inferSelect;
export type NewCurrency = typeof currenciesTable.$inferInsert;

// Export all tables for proper query building
export const tables = { currencies: currenciesTable };
