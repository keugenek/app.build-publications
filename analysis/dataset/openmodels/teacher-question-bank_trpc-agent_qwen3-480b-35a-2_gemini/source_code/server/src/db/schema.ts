import { serial, text, pgTable, timestamp, integer, pgEnum as drizzlePgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Define enums
export const questionTypeEnum = drizzlePgEnum('question_type', ['Multiple Choice', 'Open Ended']);

// Subjects table
export const subjectsTable = pgTable('subjects', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Topics table
export const topicsTable = pgTable('topics', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  subject_id: integer('subject_id').notNull().references(() => subjectsTable.id),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Questions table
export const questionsTable = pgTable('questions', {
  id: serial('id').primaryKey(),
  text: text('text').notNull(),
  type: questionTypeEnum('type').notNull(),
  correct_answer: text('correct_answer').notNull(),
  subject_id: integer('subject_id').notNull().references(() => subjectsTable.id),
  topic_id: integer('topic_id').notNull().references(() => topicsTable.id),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Quizzes table
export const quizzesTable = pgTable('quizzes', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Quiz questions table (many-to-many relationship)
export const quizQuestionsTable = pgTable('quiz_questions', {
  id: serial('id').primaryKey(),
  quiz_id: integer('quiz_id').notNull().references(() => quizzesTable.id),
  question_id: integer('question_id').notNull().references(() => questionsTable.id),
  order: integer('order').notNull(),
});

// Define relations
export const subjectsRelations = relations(subjectsTable, ({ many }) => ({
  topics: many(topicsTable),
  questions: many(questionsTable),
}));

export const topicsRelations = relations(topicsTable, ({ one, many }) => ({
  subject: one(subjectsTable, {
    fields: [topicsTable.subject_id],
    references: [subjectsTable.id],
  }),
  questions: many(questionsTable),
}));

export const questionsRelations = relations(questionsTable, ({ one }) => ({
  subject: one(subjectsTable, {
    fields: [questionsTable.subject_id],
    references: [subjectsTable.id],
  }),
  topic: one(topicsTable, {
    fields: [questionsTable.topic_id],
    references: [topicsTable.id],
  }),
}));

export const quizzesRelations = relations(quizzesTable, ({ many }) => ({
  quizQuestions: many(quizQuestionsTable),
}));

export const quizQuestionsRelations = relations(quizQuestionsTable, ({ one }) => ({
  quiz: one(quizzesTable, {
    fields: [quizQuestionsTable.quiz_id],
    references: [quizzesTable.id],
  }),
  question: one(questionsTable, {
    fields: [quizQuestionsTable.question_id],
    references: [questionsTable.id],
  }),
}));

// TypeScript types for the table schemas
export type Subject = typeof subjectsTable.$inferSelect;
export type NewSubject = typeof subjectsTable.$inferInsert;

export type Topic = typeof topicsTable.$inferSelect;
export type NewTopic = typeof topicsTable.$inferInsert;

export type Question = typeof questionsTable.$inferSelect;
export type NewQuestion = typeof questionsTable.$inferInsert;

export type Quiz = typeof quizzesTable.$inferSelect;
export type NewQuiz = typeof quizzesTable.$inferInsert;

export type QuizQuestion = typeof quizQuestionsTable.$inferSelect;
export type NewQuizQuestion = typeof quizQuestionsTable.$inferInsert;

// Important: Export all tables and relations for proper query building
export const tables = { 
  subjects: subjectsTable, 
  topics: topicsTable, 
  questions: questionsTable,
  quizzes: quizzesTable,
  quizQuestions: quizQuestionsTable
};
