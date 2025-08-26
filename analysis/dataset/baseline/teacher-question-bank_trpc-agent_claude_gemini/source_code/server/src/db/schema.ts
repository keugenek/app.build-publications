import { serial, text, pgTable, timestamp, integer, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums for database
export const difficultyEnum = pgEnum('difficulty_level', ['easy', 'medium', 'hard']);
export const correctAnswerEnum = pgEnum('correct_answer', ['A', 'B', 'C', 'D']);

// Subjects table
export const subjectsTable = pgTable('subjects', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'), // Nullable by default
  created_at: timestamp('created_at').defaultNow().notNull()
});

// Topics table
export const topicsTable = pgTable('topics', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'), // Nullable by default
  subject_id: integer('subject_id').notNull().references(() => subjectsTable.id, { onDelete: 'cascade' }),
  created_at: timestamp('created_at').defaultNow().notNull()
});

// Questions table
export const questionsTable = pgTable('questions', {
  id: serial('id').primaryKey(),
  question_text: text('question_text').notNull(),
  option_a: text('option_a').notNull(),
  option_b: text('option_b').notNull(),
  option_c: text('option_c').notNull(),
  option_d: text('option_d').notNull(),
  correct_answer: correctAnswerEnum('correct_answer').notNull(),
  explanation: text('explanation'), // Nullable by default
  difficulty_level: difficultyEnum('difficulty_level').notNull(),
  subject_id: integer('subject_id').notNull().references(() => subjectsTable.id, { onDelete: 'cascade' }),
  topic_id: integer('topic_id').notNull().references(() => topicsTable.id, { onDelete: 'cascade' }),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Quizzes table
export const quizzesTable = pgTable('quizzes', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'), // Nullable by default
  created_at: timestamp('created_at').defaultNow().notNull()
});

// Quiz questions junction table for many-to-many relationship
export const quizQuestionsTable = pgTable('quiz_questions', {
  quiz_id: integer('quiz_id').notNull().references(() => quizzesTable.id, { onDelete: 'cascade' }),
  question_id: integer('question_id').notNull().references(() => questionsTable.id, { onDelete: 'cascade' }),
  question_order: integer('question_order').notNull()
});

// Define relations for query building
export const subjectsRelations = relations(subjectsTable, ({ many }) => ({
  topics: many(topicsTable),
  questions: many(questionsTable)
}));

export const topicsRelations = relations(topicsTable, ({ one, many }) => ({
  subject: one(subjectsTable, {
    fields: [topicsTable.subject_id],
    references: [subjectsTable.id]
  }),
  questions: many(questionsTable)
}));

export const questionsRelations = relations(questionsTable, ({ one, many }) => ({
  subject: one(subjectsTable, {
    fields: [questionsTable.subject_id],
    references: [subjectsTable.id]
  }),
  topic: one(topicsTable, {
    fields: [questionsTable.topic_id],
    references: [topicsTable.id]
  }),
  quizQuestions: many(quizQuestionsTable)
}));

export const quizzesRelations = relations(quizzesTable, ({ many }) => ({
  quizQuestions: many(quizQuestionsTable)
}));

export const quizQuestionsRelations = relations(quizQuestionsTable, ({ one }) => ({
  quiz: one(quizzesTable, {
    fields: [quizQuestionsTable.quiz_id],
    references: [quizzesTable.id]
  }),
  question: one(questionsTable, {
    fields: [quizQuestionsTable.question_id],
    references: [questionsTable.id]
  })
}));

// TypeScript types for table schemas
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

// Export all tables and relations for proper query building
export const tables = {
  subjects: subjectsTable,
  topics: topicsTable,
  questions: questionsTable,
  quizzes: quizzesTable,
  quizQuestions: quizQuestionsTable
};
