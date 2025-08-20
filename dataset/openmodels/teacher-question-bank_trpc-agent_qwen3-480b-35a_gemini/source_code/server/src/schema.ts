import { z } from 'zod';

// Question schema
export const questionSchema = z.object({
  id: z.number(),
  question_text: z.string(),
  subject: z.string(),
  topic: z.string(),
  answer: z.string(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

export type Question = z.infer<typeof questionSchema>;

// Input schema for creating questions
export const createQuestionInputSchema = z.object({
  question_text: z.string(),
  subject: z.string(),
  topic: z.string(),
  answer: z.string(),
});

export type CreateQuestionInput = z.infer<typeof createQuestionInputSchema>;

// Input schema for updating questions
export const updateQuestionInputSchema = z.object({
  id: z.number(),
  question_text: z.string().optional(),
  subject: z.string().optional(),
  topic: z.string().optional(),
  answer: z.string().optional(),
});

export type UpdateQuestionInput = z.infer<typeof updateQuestionInputSchema>;

// Input schema for deleting questions
export const deleteQuestionInputSchema = z.object({
  id: z.number(),
});

export type DeleteQuestionInput = z.infer<typeof deleteQuestionInputSchema>;

// Input schema for fetching questions by subject and topic
export const getQuestionsBySubjectTopicInputSchema = z.object({
  subject: z.string(),
  topic: z.string(),
});

export type GetQuestionsBySubjectTopicInput = z.infer<typeof getQuestionsBySubjectTopicInputSchema>;

// Input schema for generating quizzes
export const generateQuizInputSchema = z.object({
  subject: z.string(),
  topic: z.string(),
  count: z.number().int().positive(),
});

export type GenerateQuizInput = z.infer<typeof generateQuizInputSchema>;

// Schema for quiz questions
export const quizQuestionSchema = z.object({
  id: z.number(),
  question_text: z.string(),
  answer: z.string(),
});

export type QuizQuestion = z.infer<typeof quizQuestionSchema>;
