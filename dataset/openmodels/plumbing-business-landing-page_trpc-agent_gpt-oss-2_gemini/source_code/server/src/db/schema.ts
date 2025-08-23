import { pgTable, serial, text, timestamp, integer } from 'drizzle-orm/pg-core';

// Leads table stores contact form submissions
export const leadsTable = pgTable('leads', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  phone: text('phone').notNull(),
  message: text('message'), // Nullable by default (no .notNull())
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Types inferred from the table for SELECT and INSERT operations
export type Lead = typeof leadsTable.$inferSelect;
export type NewLead = typeof leadsTable.$inferInsert;

// Export tables for relation queries
export const tables = {
  leads: leadsTable,
};
