import { z } from 'zod';

// Subject schema
export const subjectSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  created_at: z.coerce.date()
});

export type Subject = z.infer<typeof subjectSchema>;

// Topic schema
export const topicSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  subject_id: z.number(),
  created_at: z.coerce.date()
});

export type Topic = z.infer<typeof topicSchema>;

// Question schema
export const questionSchema = z.object({
  id: z.number(),
  question_text: z.string(),
  answer_text: z.string(),
  subject_id: z.number(),
  topic_id: z.number(),
  created_at: z.coerce.date()
});

export type Question = z.infer<typeof questionSchema>;

// Quiz schema
export const quizSchema = z.object({
  id: z.number(),
  title: z.string(),
  subject_id: z.number(),
  topic_id: z.number(),
  question_count: z.number().int(),
  created_at: z.coerce.date()
});

export type Quiz = z.infer<typeof quizSchema>;

// Quiz question junction schema
export const quizQuestionSchema = z.object({
  id: z.number(),
  quiz_id: z.number(),
  question_id: z.number(),
  order_index: z.number().int()
});

export type QuizQuestion = z.infer<typeof quizQuestionSchema>;

// Input schemas for creating entities
export const createSubjectInputSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable()
});

export type CreateSubjectInput = z.infer<typeof createSubjectInputSchema>;

export const createTopicInputSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable(),
  subject_id: z.number()
});

export type CreateTopicInput = z.infer<typeof createTopicInputSchema>;

export const createQuestionInputSchema = z.object({
  question_text: z.string().min(1),
  answer_text: z.string().min(1),
  subject_id: z.number(),
  topic_id: z.number()
});

export type CreateQuestionInput = z.infer<typeof createQuestionInputSchema>;

export const generateQuizInputSchema = z.object({
  title: z.string().min(1),
  subject_id: z.number(),
  topic_id: z.number(),
  question_count: z.number().int().positive()
});

export type GenerateQuizInput = z.infer<typeof generateQuizInputSchema>;

// Update schemas
export const updateSubjectInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional()
});

export type UpdateSubjectInput = z.infer<typeof updateSubjectInputSchema>;

export const updateTopicInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  subject_id: z.number().optional()
});

export type UpdateTopicInput = z.infer<typeof updateTopicInputSchema>;

export const updateQuestionInputSchema = z.object({
  id: z.number(),
  question_text: z.string().min(1).optional(),
  answer_text: z.string().min(1).optional(),
  subject_id: z.number().optional(),
  topic_id: z.number().optional()
});

export type UpdateQuestionInput = z.infer<typeof updateQuestionInputSchema>;

// Export quiz to PDF input schema
export const exportQuizToPdfInputSchema = z.object({
  quiz_id: z.number(),
  include_answers: z.boolean().default(false)
});

export type ExportQuizToPdfInput = z.infer<typeof exportQuizToPdfInputSchema>;

// Quiz with questions type for detailed quiz data
export const quizWithQuestionsSchema = z.object({
  id: z.number(),
  title: z.string(),
  subject_id: z.number(),
  topic_id: z.number(),
  question_count: z.number().int(),
  created_at: z.coerce.date(),
  questions: z.array(questionSchema)
});

export type QuizWithQuestions = z.infer<typeof quizWithQuestionsSchema>;
