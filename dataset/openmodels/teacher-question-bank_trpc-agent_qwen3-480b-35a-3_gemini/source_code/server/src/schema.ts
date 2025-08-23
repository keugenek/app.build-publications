import { z } from 'zod';

// Subject schema
export const subjectSchema = z.object({
  id: z.number(),
  name: z.string(),
  created_at: z.coerce.date()
});

export type Subject = z.infer<typeof subjectSchema>;

// Topic schema
export const topicSchema = z.object({
  id: z.number(),
  name: z.string(),
  subject_id: z.number(),
  created_at: z.coerce.date()
});

export type Topic = z.infer<typeof topicSchema>;

// Question schema
export const questionSchema = z.object({
  id: z.number(),
  text: z.string(),
  answer: z.string(),
  subject_id: z.number(),
  topic_id: z.number(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Question = z.infer<typeof questionSchema>;

// Quiz schema
export const quizSchema = z.object({
  id: z.number(),
  name: z.string(),
  created_at: z.coerce.date()
});

export type Quiz = z.infer<typeof quizSchema>;

// Quiz question schema (junction table)
export const quizQuestionSchema = z.object({
  id: z.number(),
  quiz_id: z.number(),
  question_id: z.number(),
  order: z.number()
});

export type QuizQuestion = z.infer<typeof quizQuestionSchema>;

// Input schema for creating subjects
export const createSubjectInputSchema = z.object({
  name: z.string().min(1, "Subject name is required")
});

export type CreateSubjectInput = z.infer<typeof createSubjectInputSchema>;

// Input schema for creating topics
export const createTopicInputSchema = z.object({
  name: z.string().min(1, "Topic name is required"),
  subject_id: z.number()
});

export type CreateTopicInput = z.infer<typeof createTopicInputSchema>;

// Input schema for creating questions
export const createQuestionInputSchema = z.object({
  text: z.string().min(1, "Question text is required"),
  answer: z.string().min(1, "Answer is required"),
  subject_id: z.number(),
  topic_id: z.number()
});

export type CreateQuestionInput = z.infer<typeof createQuestionInputSchema>;

// Input schema for updating questions
export const updateQuestionInputSchema = z.object({
  id: z.number(),
  text: z.string().optional(),
  answer: z.string().optional(),
  subject_id: z.number().optional(),
  topic_id: z.number().optional()
});

export type UpdateQuestionInput = z.infer<typeof updateQuestionInputSchema>;

// Input schema for generating quizzes
export const generateQuizInputSchema = z.object({
  name: z.string().min(1, "Quiz name is required"),
  subject_id: z.number().optional(),
  topic_id: z.number().optional(),
  count: z.number().int().positive().min(1, "Count must be at least 1")
});

export type GenerateQuizInput = z.infer<typeof generateQuizInputSchema>;
