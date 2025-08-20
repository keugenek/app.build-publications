import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

// Questions table definition
export const questionsTable = pgTable('questions', {
  id: serial('id').primaryKey(),
  subject: text('subject').notNull(),
  topic: text('topic').notNull(),
  question_text: text('question_text').notNull(),
  answer_text: text('answer_text').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Types for queries and inserts
export type Question = typeof questionsTable.$inferSelect;
export type NewQuestion = typeof questionsTable.$inferInsert;

// Export all tables for relation queries
export const tables = { questions: questionsTable };
