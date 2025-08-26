import { z } from 'zod';

// JLPT levels enum
export const jlptLevelSchema = z.enum(['N5', 'N4', 'N3', 'N2', 'N1']);
export type JlptLevel = z.infer<typeof jlptLevelSchema>;

// Kanji schema
export const kanjiSchema = z.object({
  id: z.number(),
  character: z.string(),
  meaning: z.string(),
  on_reading: z.string().nullable(),
  kun_reading: z.string().nullable(),
  jlpt_level: jlptLevelSchema,
  created_at: z.coerce.date()
});

export type Kanji = z.infer<typeof kanjiSchema>;

// Input schema for creating kanji
export const createKanjiInputSchema = z.object({
  character: z.string().min(1),
  meaning: z.string().min(1),
  on_reading: z.string().nullable(),
  kun_reading: z.string().nullable(),
  jlpt_level: jlptLevelSchema
});

export type CreateKanjiInput = z.infer<typeof createKanjiInputSchema>;

// User progress schema
export const userProgressSchema = z.object({
  id: z.number(),
  user_id: z.string(),
  kanji_id: z.number(),
  is_learned: z.boolean(),
  review_count: z.number().int().nonnegative(),
  last_reviewed: z.coerce.date().nullable(),
  next_review: z.coerce.date().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type UserProgress = z.infer<typeof userProgressSchema>;

// Input schema for creating user progress
export const createUserProgressInputSchema = z.object({
  user_id: z.string().min(1),
  kanji_id: z.number(),
  is_learned: z.boolean().default(false),
  review_count: z.number().int().nonnegative().default(0),
  last_reviewed: z.coerce.date().nullable().optional(),
  next_review: z.coerce.date().nullable().optional()
});

export type CreateUserProgressInput = z.infer<typeof createUserProgressInputSchema>;

// Input schema for updating user progress
export const updateUserProgressInputSchema = z.object({
  user_id: z.string(),
  kanji_id: z.number(),
  is_learned: z.boolean().optional(),
  review_count: z.number().int().nonnegative().optional(),
  last_reviewed: z.coerce.date().nullable().optional(),
  next_review: z.coerce.date().nullable().optional()
});

export type UpdateUserProgressInput = z.infer<typeof updateUserProgressInputSchema>;

// Query schema for getting kanji by JLPT level
export const getKanjiByLevelInputSchema = z.object({
  jlpt_level: jlptLevelSchema,
  user_id: z.string().optional()
});

export type GetKanjiByLevelInput = z.infer<typeof getKanjiByLevelInputSchema>;

// Query schema for getting user progress by level
export const getUserProgressByLevelInputSchema = z.object({
  user_id: z.string(),
  jlpt_level: jlptLevelSchema.optional()
});

export type GetUserProgressByLevelInput = z.infer<typeof getUserProgressByLevelInputSchema>;

// Response schema for kanji with progress
export const kanjiWithProgressSchema = z.object({
  id: z.number(),
  character: z.string(),
  meaning: z.string(),
  on_reading: z.string().nullable(),
  kun_reading: z.string().nullable(),
  jlpt_level: jlptLevelSchema,
  created_at: z.coerce.date(),
  progress: z.object({
    is_learned: z.boolean(),
    review_count: z.number(),
    last_reviewed: z.coerce.date().nullable(),
    next_review: z.coerce.date().nullable()
  }).nullable()
});

export type KanjiWithProgress = z.infer<typeof kanjiWithProgressSchema>;

// Progress summary schema
export const progressSummarySchema = z.object({
  jlpt_level: jlptLevelSchema,
  total_kanji: z.number().int(),
  learned_kanji: z.number().int(),
  progress_percentage: z.number()
});

export type ProgressSummary = z.infer<typeof progressSummarySchema>;
