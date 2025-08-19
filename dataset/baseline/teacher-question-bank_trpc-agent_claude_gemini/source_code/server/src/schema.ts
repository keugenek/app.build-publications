import { z } from 'zod';

// Subject schema
export const subjectSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  created_at: z.coerce.date()
});

export type Subject = z.infer<typeof subjectSchema>;

// Input schema for creating subjects
export const createSubjectInputSchema = z.object({
  name: z.string().min(1, 'Subject name is required'),
  description: z.string().nullable()
});

export type CreateSubjectInput = z.infer<typeof createSubjectInputSchema>;

// Input schema for updating subjects
export const updateSubjectInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1, 'Subject name is required').optional(),
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

// Input schema for creating topics
export const createTopicInputSchema = z.object({
  name: z.string().min(1, 'Topic name is required'),
  description: z.string().nullable(),
  subject_id: z.number()
});

export type CreateTopicInput = z.infer<typeof createTopicInputSchema>;

// Input schema for updating topics
export const updateTopicInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1, 'Topic name is required').optional(),
  description: z.string().nullable().optional(),
  subject_id: z.number().optional()
});

export type UpdateTopicInput = z.infer<typeof updateTopicInputSchema>;

// Question schema
export const questionSchema = z.object({
  id: z.number(),
  question_text: z.string(),
  option_a: z.string(),
  option_b: z.string(),
  option_c: z.string(),
  option_d: z.string(),
  correct_answer: z.enum(['A', 'B', 'C', 'D']),
  explanation: z.string().nullable(),
  difficulty_level: z.enum(['easy', 'medium', 'hard']),
  subject_id: z.number(),
  topic_id: z.number(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Question = z.infer<typeof questionSchema>;

// Input schema for creating questions
export const createQuestionInputSchema = z.object({
  question_text: z.string().min(1, 'Question text is required'),
  option_a: z.string().min(1, 'Option A is required'),
  option_b: z.string().min(1, 'Option B is required'),
  option_c: z.string().min(1, 'Option C is required'),
  option_d: z.string().min(1, 'Option D is required'),
  correct_answer: z.enum(['A', 'B', 'C', 'D']),
  explanation: z.string().nullable(),
  difficulty_level: z.enum(['easy', 'medium', 'hard']),
  subject_id: z.number(),
  topic_id: z.number()
});

export type CreateQuestionInput = z.infer<typeof createQuestionInputSchema>;

// Input schema for updating questions
export const updateQuestionInputSchema = z.object({
  id: z.number(),
  question_text: z.string().min(1, 'Question text is required').optional(),
  option_a: z.string().min(1, 'Option A is required').optional(),
  option_b: z.string().min(1, 'Option B is required').optional(),
  option_c: z.string().min(1, 'Option C is required').optional(),
  option_d: z.string().min(1, 'Option D is required').optional(),
  correct_answer: z.enum(['A', 'B', 'C', 'D']).optional(),
  explanation: z.string().nullable().optional(),
  difficulty_level: z.enum(['easy', 'medium', 'hard']).optional(),
  subject_id: z.number().optional(),
  topic_id: z.number().optional()
});

export type UpdateQuestionInput = z.infer<typeof updateQuestionInputSchema>;

// Quiz schema
export const quizSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  created_at: z.coerce.date()
});

export type Quiz = z.infer<typeof quizSchema>;

// Quiz question relationship schema
export const quizQuestionSchema = z.object({
  quiz_id: z.number(),
  question_id: z.number(),
  question_order: z.number()
});

export type QuizQuestion = z.infer<typeof quizQuestionSchema>;

// Input schema for generating quizzes
export const generateQuizInputSchema = z.object({
  title: z.string().min(1, 'Quiz title is required'),
  description: z.string().nullable(),
  subject_ids: z.array(z.number()).min(1, 'At least one subject must be selected'),
  topic_ids: z.array(z.number()).optional(),
  question_count: z.number().int().positive().max(100, 'Maximum 100 questions allowed'),
  difficulty_levels: z.array(z.enum(['easy', 'medium', 'hard'])).optional()
});

export type GenerateQuizInput = z.infer<typeof generateQuizInputSchema>;

// Quiz with questions schema for detailed quiz data
export const quizWithQuestionsSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  created_at: z.coerce.date(),
  questions: z.array(questionSchema)
});

export type QuizWithQuestions = z.infer<typeof quizWithQuestionsSchema>;

// Input schema for deleting entities
export const deleteInputSchema = z.object({
  id: z.number()
});

export type DeleteInput = z.infer<typeof deleteInputSchema>;

// Input schema for getting entity by ID
export const getByIdInputSchema = z.object({
  id: z.number()
});

export type GetByIdInput = z.infer<typeof getByIdInputSchema>;

// Input schema for getting topics by subject
export const getTopicsBySubjectInputSchema = z.object({
  subject_id: z.number()
});

export type GetTopicsBySubjectInput = z.infer<typeof getTopicsBySubjectInputSchema>;

// Input schema for getting questions with filters
export const getQuestionsInputSchema = z.object({
  subject_id: z.number().optional(),
  topic_id: z.number().optional(),
  difficulty_level: z.enum(['easy', 'medium', 'hard']).optional(),
  limit: z.number().int().positive().max(100).optional(),
  offset: z.number().int().nonnegative().optional()
});

export type GetQuestionsInput = z.infer<typeof getQuestionsInputSchema>;

// Input schema for quiz export
export const exportQuizInputSchema = z.object({
  quiz_id: z.number(),
  include_answers: z.boolean().optional().default(false)
});

export type ExportQuizInput = z.infer<typeof exportQuizInputSchema>;
