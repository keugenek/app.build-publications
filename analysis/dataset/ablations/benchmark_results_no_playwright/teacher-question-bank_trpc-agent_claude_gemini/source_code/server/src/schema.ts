import { z } from 'zod';

// Subject schema
export const subjectSchema = z.object({
  id: z.number(),
  name: z.string(),
  created_at: z.coerce.date()
});

export type Subject = z.infer<typeof subjectSchema>;

// Input schema for creating subjects
export const createSubjectInputSchema = z.object({
  name: z.string().min(1, "Subject name is required")
});

export type CreateSubjectInput = z.infer<typeof createSubjectInputSchema>;

// Input schema for updating subjects
export const updateSubjectInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1, "Subject name is required").optional()
});

export type UpdateSubjectInput = z.infer<typeof updateSubjectInputSchema>;

// Topic schema
export const topicSchema = z.object({
  id: z.number(),
  name: z.string(),
  subject_id: z.number(),
  created_at: z.coerce.date()
});

export type Topic = z.infer<typeof topicSchema>;

// Input schema for creating topics
export const createTopicInputSchema = z.object({
  name: z.string().min(1, "Topic name is required"),
  subject_id: z.number().positive("Subject ID must be a positive number")
});

export type CreateTopicInput = z.infer<typeof createTopicInputSchema>;

// Input schema for updating topics
export const updateTopicInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1, "Topic name is required").optional(),
  subject_id: z.number().positive("Subject ID must be a positive number").optional()
});

export type UpdateTopicInput = z.infer<typeof updateTopicInputSchema>;

// Question schema
export const questionSchema = z.object({
  id: z.number(),
  text: z.string(),
  subject_id: z.number(),
  topic_id: z.number(),
  created_at: z.coerce.date()
});

export type Question = z.infer<typeof questionSchema>;

// Input schema for creating questions
export const createQuestionInputSchema = z.object({
  text: z.string().min(1, "Question text is required"),
  subject_id: z.number().positive("Subject ID must be a positive number"),
  topic_id: z.number().positive("Topic ID must be a positive number")
});

export type CreateQuestionInput = z.infer<typeof createQuestionInputSchema>;

// Input schema for updating questions
export const updateQuestionInputSchema = z.object({
  id: z.number(),
  text: z.string().min(1, "Question text is required").optional(),
  subject_id: z.number().positive("Subject ID must be a positive number").optional(),
  topic_id: z.number().positive("Topic ID must be a positive number").optional()
});

export type UpdateQuestionInput = z.infer<typeof updateQuestionInputSchema>;

// Quiz schema
export const quizSchema = z.object({
  id: z.number(),
  title: z.string(),
  created_at: z.coerce.date()
});

export type Quiz = z.infer<typeof quizSchema>;

// Input schema for creating quizzes
export const createQuizInputSchema = z.object({
  title: z.string().min(1, "Quiz title is required"),
  question_ids: z.array(z.number().positive()).min(1, "At least one question is required")
});

export type CreateQuizInput = z.infer<typeof createQuizInputSchema>;

// Schema for generating quizzes by filters
export const generateQuizInputSchema = z.object({
  title: z.string().min(1, "Quiz title is required"),
  subject_ids: z.array(z.number().positive()).optional(),
  topic_ids: z.array(z.number().positive()).optional(),
  limit: z.number().int().positive().optional()
});

export type GenerateQuizInput = z.infer<typeof generateQuizInputSchema>;

// Schema for quiz with questions
export const quizWithQuestionsSchema = z.object({
  id: z.number(),
  title: z.string(),
  created_at: z.coerce.date(),
  questions: z.array(questionSchema)
});

export type QuizWithQuestions = z.infer<typeof quizWithQuestionsSchema>;

// Input schema for getting questions by filters
export const getQuestionsByFiltersInputSchema = z.object({
  subject_ids: z.array(z.number().positive()).optional(),
  topic_ids: z.array(z.number().positive()).optional(),
  limit: z.number().int().positive().optional()
});

export type GetQuestionsByFiltersInput = z.infer<typeof getQuestionsByFiltersInputSchema>;

// Delete input schemas
export const deleteSubjectInputSchema = z.object({
  id: z.number().positive()
});

export type DeleteSubjectInput = z.infer<typeof deleteSubjectInputSchema>;

export const deleteTopicInputSchema = z.object({
  id: z.number().positive()
});

export type DeleteTopicInput = z.infer<typeof deleteTopicInputSchema>;

export const deleteQuestionInputSchema = z.object({
  id: z.number().positive()
});

export type DeleteQuestionInput = z.infer<typeof deleteQuestionInputSchema>;

export const deleteQuizInputSchema = z.object({
  id: z.number().positive()
});

export type DeleteQuizInput = z.infer<typeof deleteQuizInputSchema>;

// Get by ID schemas
export const getByIdInputSchema = z.object({
  id: z.number().positive()
});

export type GetByIdInput = z.infer<typeof getByIdInputSchema>;
