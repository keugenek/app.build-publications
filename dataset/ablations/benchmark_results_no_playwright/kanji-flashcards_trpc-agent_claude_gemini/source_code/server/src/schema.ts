import { z } from 'zod';

// JLPT Level enum
export const jlptLevelEnum = z.enum(['N5', 'N4', 'N3', 'N2', 'N1']);
export type JLPTLevel = z.infer<typeof jlptLevelEnum>;

// SRS Level enum (stages of spaced repetition)
export const srsLevelEnum = z.enum(['APPRENTICE_1', 'APPRENTICE_2', 'APPRENTICE_3', 'APPRENTICE_4', 'GURU_1', 'GURU_2', 'MASTER', 'ENLIGHTENED', 'BURNED']);
export type SRSLevel = z.infer<typeof srsLevelEnum>;

// Review result enum
export const reviewResultEnum = z.enum(['CORRECT', 'INCORRECT']);
export type ReviewResult = z.infer<typeof reviewResultEnum>;

// User schema
export const userSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  username: z.string(),
  password_hash: z.string(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type User = z.infer<typeof userSchema>;

// Kanji schema
export const kanjiSchema = z.object({
  id: z.number(),
  character: z.string(),
  meaning_english: z.string(),
  reading_hiragana: z.string(),
  reading_katakana: z.string().nullable(),
  jlpt_level: jlptLevelEnum,
  created_at: z.coerce.date()
});

export type Kanji = z.infer<typeof kanjiSchema>;

// User progress schema
export const userProgressSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  kanji_id: z.number(),
  srs_level: srsLevelEnum,
  next_review_at: z.coerce.date(),
  correct_streak: z.number().int(),
  total_reviews: z.number().int(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type UserProgress = z.infer<typeof userProgressSchema>;

// Review history schema
export const reviewHistorySchema = z.object({
  id: z.number(),
  user_id: z.number(),
  kanji_id: z.number(),
  result: reviewResultEnum,
  previous_srs_level: srsLevelEnum,
  new_srs_level: srsLevelEnum,
  review_time_ms: z.number().int(),
  created_at: z.coerce.date()
});

export type ReviewHistory = z.infer<typeof reviewHistorySchema>;

// Input schemas for authentication
export const registerUserInputSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(50),
  password: z.string().min(6)
});

export type RegisterUserInput = z.infer<typeof registerUserInputSchema>;

export const loginUserInputSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

export type LoginUserInput = z.infer<typeof loginUserInputSchema>;

// Input schemas for kanji management
export const createKanjiInputSchema = z.object({
  character: z.string().length(1),
  meaning_english: z.string(),
  reading_hiragana: z.string(),
  reading_katakana: z.string().nullable(),
  jlpt_level: jlptLevelEnum
});

export type CreateKanjiInput = z.infer<typeof createKanjiInputSchema>;

// Input schemas for reviews
export const submitReviewInputSchema = z.object({
  user_id: z.number(),
  kanji_id: z.number(),
  result: reviewResultEnum,
  review_time_ms: z.number().int().positive()
});

export type SubmitReviewInput = z.infer<typeof submitReviewInputSchema>;

// Query schemas
export const getDueReviewsInputSchema = z.object({
  user_id: z.number(),
  limit: z.number().int().positive().optional().default(20)
});

export type GetDueReviewsInput = z.infer<typeof getDueReviewsInputSchema>;

export const getProgressByLevelInputSchema = z.object({
  user_id: z.number(),
  jlpt_level: jlptLevelEnum.optional()
});

export type GetProgressByLevelInput = z.infer<typeof getProgressByLevelInputSchema>;

export const getKanjiByLevelInputSchema = z.object({
  jlpt_level: jlptLevelEnum,
  limit: z.number().int().positive().optional().default(50),
  offset: z.number().int().nonnegative().optional().default(0)
});

export type GetKanjiByLevelInput = z.infer<typeof getKanjiByLevelInputSchema>;

// Extended types with relations
export const kanjiWithProgressSchema = kanjiSchema.extend({
  user_progress: userProgressSchema.nullable()
});

export type KanjiWithProgress = z.infer<typeof kanjiWithProgressSchema>;

export const progressStatsSchema = z.object({
  jlpt_level: jlptLevelEnum,
  total_kanji: z.number().int(),
  learned_kanji: z.number().int(),
  due_for_review: z.number().int(),
  completion_percentage: z.number()
});

export type ProgressStats = z.infer<typeof progressStatsSchema>;

// Authentication response schemas
export const authResponseSchema = z.object({
  user: userSchema.omit({ password_hash: true }),
  token: z.string().optional()
});

export type AuthResponse = z.infer<typeof authResponseSchema>;
