import { serial, text, pgTable, timestamp } from 'drizzle-orm/pg-core';

export const contactLeadsTable = pgTable('contact_leads', {
  id: serial('id').primaryKey(),
  customer_name: text('customer_name').notNull(),
  email: text('email').notNull(),
  phone: text('phone').notNull(),
  message: text('message').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// TypeScript types for the table schema
export type ContactLead = typeof contactLeadsTable.$inferSelect; // For SELECT operations
export type NewContactLead = typeof contactLeadsTable.$inferInsert; // For INSERT operations

// Important: Export all tables for proper query building
export const tables = { contactLeads: contactLeadsTable };
