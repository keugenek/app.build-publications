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

// Question type enum
export const questionTypeEnum = z.enum(['Multiple Choice', 'Open Ended']);

export type QuestionType = z.infer<typeof questionTypeEnum>;

// Question schema
export const questionSchema = z.object({
  id: z.number(),
  text: z.string(),
  type: questionTypeEnum,
  correct_answer: z.string(),
  subject_id: z.number(),
  topic_id: z.number(),
  created_at: z.coerce.date()
});

export type Question = z.infer<typeof questionSchema>;

// Quiz schema
export const quizSchema = z.object({
  id: z.number(),
  name: z.string(),
  created_at: z.coerce.date()
});

export type Quiz = z.infer<typeof quizSchema>;

// Quiz question schema (for linking questions to quizzes)
export const quizQuestionSchema = z.object({
  id: z.number(),
  quiz_id: z.number(),
  question_id: z.number(),
  order: z.number()
});

export type QuizQuestion = z.infer<typeof quizQuestionSchema>;

// Input schemas for creating entities
export const createSubjectInputSchema = z.object({
  name: z.string().min(1, "Subject name is required")
});

export type CreateSubjectInput = z.infer<typeof createSubjectInputSchema>;

export const createTopicInputSchema = z.object({
  name: z.string().min(1, "Topic name is required"),
  subject_id: z.number()
});

export type CreateTopicInput = z.infer<typeof createTopicInputSchema>;

export const createQuestionInputSchema = z.object({
  text: z.string().min(1, "Question text is required"),
  type: questionTypeEnum,
  correct_answer: z.string().min(1, "Correct answer is required"),
  subject_id: z.number(),
  topic_id: z.number()
});

export type CreateQuestionInput = z.infer<typeof createQuestionInputSchema>;

export const generateQuizInputSchema = z.object({
  subject_ids: z.array(z.number()).min(1, "At least one subject must be selected"),
  topic_ids: z.array(z.number()).optional(),
  num_questions: z.number().int().positive().max(100, "Number of questions must be between 1 and 100")
});

export type GenerateQuizInput = z.infer<typeof generateQuizInputSchema>;

// Update schemas
export const updateSubjectInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1, "Subject name is required").optional()
});

export type UpdateSubjectInput = z.infer<typeof updateSubjectInputSchema>;

export const updateTopicInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1, "Topic name is required").optional(),
  subject_id: z.number().optional()
});

export type UpdateTopicInput = z.infer<typeof updateTopicInputSchema>;

export const updateQuestionInputSchema = z.object({
  id: z.number(),
  text: z.string().min(1, "Question text is required").optional(),
  type: questionTypeEnum.optional(),
  correct_answer: z.string().min(1, "Correct answer is required").optional(),
  subject_id: z.number().optional(),
  topic_id: z.number().optional()
});

export type UpdateQuestionInput = z.infer<typeof updateQuestionInputSchema>;
