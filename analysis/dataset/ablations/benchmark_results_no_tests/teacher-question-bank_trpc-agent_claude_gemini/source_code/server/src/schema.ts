import { z } from 'zod';

// Question type enum
export const questionTypeSchema = z.enum(['multiple-choice', 'open-ended', 'true-false', 'short-answer']);
export type QuestionType = z.infer<typeof questionTypeSchema>;

// Subject schema
export const subjectSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  created_at: z.coerce.date()
});

export type Subject = z.infer<typeof subjectSchema>;

export const createSubjectInputSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable().optional()
});

export type CreateSubjectInput = z.infer<typeof createSubjectInputSchema>;

export const updateSubjectInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional()
});

export type UpdateSubjectInput = z.infer<typeof updateSubjectInputSchema>;

// Topic schema
export const topicSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  subject_id: z.number(),
  created_at: z.coerce.date()
});

export type Topic = z.infer<typeof topicSchema>;

export const createTopicInputSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  subject_id: z.number()
});

export type CreateTopicInput = z.infer<typeof createTopicInputSchema>;

export const updateTopicInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  subject_id: z.number().optional()
});

export type UpdateTopicInput = z.infer<typeof updateTopicInputSchema>;

// Question schema
export const questionSchema = z.object({
  id: z.number(),
  question_text: z.string(),
  subject_id: z.number(),
  topic_id: z.number(),
  type: questionTypeSchema,
  answer: z.string(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Question = z.infer<typeof questionSchema>;

export const createQuestionInputSchema = z.object({
  question_text: z.string().min(1),
  subject_id: z.number(),
  topic_id: z.number(),
  type: questionTypeSchema,
  answer: z.string().min(1)
});

export type CreateQuestionInput = z.infer<typeof createQuestionInputSchema>;

export const updateQuestionInputSchema = z.object({
  id: z.number(),
  question_text: z.string().min(1).optional(),
  subject_id: z.number().optional(),
  topic_id: z.number().optional(),
  type: questionTypeSchema.optional(),
  answer: z.string().min(1).optional()
});

export type UpdateQuestionInput = z.infer<typeof updateQuestionInputSchema>;

// Multiple choice option schema
export const multipleChoiceOptionSchema = z.object({
  id: z.number(),
  question_id: z.number(),
  option_text: z.string(),
  is_correct: z.boolean(),
  created_at: z.coerce.date()
});

export type MultipleChoiceOption = z.infer<typeof multipleChoiceOptionSchema>;

export const createMultipleChoiceOptionInputSchema = z.object({
  question_id: z.number(),
  option_text: z.string().min(1),
  is_correct: z.boolean()
});

export type CreateMultipleChoiceOptionInput = z.infer<typeof createMultipleChoiceOptionInputSchema>;

export const updateMultipleChoiceOptionInputSchema = z.object({
  id: z.number(),
  option_text: z.string().min(1).optional(),
  is_correct: z.boolean().optional()
});

export type UpdateMultipleChoiceOptionInput = z.infer<typeof updateMultipleChoiceOptionInputSchema>;

// Quiz schema
export const quizSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  created_at: z.coerce.date()
});

export type Quiz = z.infer<typeof quizSchema>;

export const createQuizInputSchema = z.object({
  title: z.string().min(1),
  description: z.string().nullable().optional()
});

export type CreateQuizInput = z.infer<typeof createQuizInputSchema>;

// Quiz question schema (junction table)
export const quizQuestionSchema = z.object({
  id: z.number(),
  quiz_id: z.number(),
  question_id: z.number(),
  order_index: z.number().int()
});

export type QuizQuestion = z.infer<typeof quizQuestionSchema>;

// Quiz generation input schema
export const generateQuizInputSchema = z.object({
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  subject_id: z.number().optional(),
  topic_id: z.number().optional(),
  question_count: z.number().int().positive(),
  question_types: z.array(questionTypeSchema).optional()
});

export type GenerateQuizInput = z.infer<typeof generateQuizInputSchema>;

// Quiz with questions schema (for detailed quiz retrieval)
export const quizWithQuestionsSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  created_at: z.coerce.date(),
  questions: z.array(questionSchema)
});

export type QuizWithQuestions = z.infer<typeof quizWithQuestionsSchema>;

// Question with options schema (for detailed question retrieval)
export const questionWithOptionsSchema = z.object({
  id: z.number(),
  question_text: z.string(),
  subject_id: z.number(),
  topic_id: z.number(),
  type: questionTypeSchema,
  answer: z.string(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
  options: z.array(multipleChoiceOptionSchema).optional()
});

export type QuestionWithOptions = z.infer<typeof questionWithOptionsSchema>;

// PDF export input schema
export const exportQuizToPdfInputSchema = z.object({
  quiz_id: z.number(),
  include_answers: z.boolean().default(false)
});

export type ExportQuizToPdfInput = z.infer<typeof exportQuizToPdfInputSchema>;

// Filters for questions
export const questionFiltersSchema = z.object({
  subject_id: z.number().optional(),
  topic_id: z.number().optional(),
  type: questionTypeSchema.optional()
});

export type QuestionFilters = z.infer<typeof questionFiltersSchema>;
