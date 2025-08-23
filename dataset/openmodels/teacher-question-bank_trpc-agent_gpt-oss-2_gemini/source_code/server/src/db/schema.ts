import { serial, text, timestamp, pgTable } from 'drizzle-orm/pg-core';

export const questionsTable = pgTable('questions', {
  id: serial('id').primaryKey(),
  subject: text('subject').notNull(),
  topic: text('topic').notNull(),
  content: text('content').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Export table types for SELECT and INSERT operations
export type Question = typeof questionsTable.$inferSelect;
export type NewQuestion = typeof questionsTable.$inferInsert;

// For now, quizzes are generated on the fly, not persisted. If needed later, define a quizzes table.

export const tables = { questions: questionsTable };
