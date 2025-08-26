import { serial, text, pgTable, timestamp, integer } from 'drizzle-orm/pg-core';

export const sessionsTable = pgTable('sessions', {
  id: serial('id').primaryKey(),
  type: text('type').notNull(), // 'work' or 'break'
  duration: integer('duration').notNull(), // Duration in minutes
  completed_at: timestamp('completed_at').defaultNow().notNull(),
});

// TypeScript types for the table schema
export type Session = typeof sessionsTable.$inferSelect; // For SELECT operations
export type NewSession = typeof sessionsTable.$inferInsert; // For INSERT operations

// Export all tables for proper query building
export const tables = { sessions: sessionsTable };
