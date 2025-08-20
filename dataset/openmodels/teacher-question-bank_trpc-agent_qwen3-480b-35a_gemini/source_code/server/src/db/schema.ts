import { serial, text, pgTable, timestamp } from 'drizzle-orm/pg-core';

export const questionsTable = pgTable('questions', {
  id: serial('id').primaryKey(),
  question_text: text('question_text').notNull(),
  subject: text('subject').notNull(),
  topic: text('topic').notNull(),
  answer: text('answer').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// TypeScript types for the table schema
export type Question = typeof questionsTable.$inferSelect;
export type NewQuestion = typeof questionsTable.$inferInsert;

// Export all tables for proper query building
export const tables = { questions: questionsTable };
