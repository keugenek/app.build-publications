import { z } from 'zod';

// -------------------
// Question schemas
// -------------------
export const questionSchema = z.object({
  id: z.number(),
  subject: z.string(),
  topic: z.string(),
  question_text: z.string(),
  answer_text: z.string(),
  created_at: z.coerce.date(),
});

export type Question = z.infer<typeof questionSchema>;

// Input schema for creating a question
export const createQuestionInputSchema = z.object({
  subject: z.string(),
  topic: z.string(),
  question_text: z.string(),
  answer_text: z.string(),
});

export type CreateQuestionInput = z.infer<typeof createQuestionInputSchema>;

// Input schema for updating a question (partial)
export const updateQuestionInputSchema = z.object({
  id: z.number(),
  subject: z.string().optional(),
  topic: z.string().optional(),
  question_text: z.string().optional(),
  answer_text: z.string().optional(),
});

export type UpdateQuestionInput = z.infer<typeof updateQuestionInputSchema>;

// Input schema for deleting a question
export const deleteQuestionInputSchema = z.object({
  id: z.number(),
});

export type DeleteQuestionInput = z.infer<typeof deleteQuestionInputSchema>;

// Input schema for generating a quiz
export const generateQuizInputSchema = z.object({
  // Array of subjects to include
  subjects: z.array(z.string()).nonempty(),
  // Optional topics filter; if omitted, any topic is allowed
  topics: z.array(z.string()).optional(),
  // Number of questions desired in the quiz
  count: z.number().int().positive(),
});

export type GenerateQuizInput = z.infer<typeof generateQuizInputSchema>;
