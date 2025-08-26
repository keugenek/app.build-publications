import { z } from 'zod';

// JLPT Level enum
export const jlptLevelSchema = z.enum(['N5', 'N4', 'N3', 'N2', 'N1']);
export type JLPTLevel = z.infer<typeof jlptLevelSchema>;

// SRS Level enum - represents spaced repetition intervals
export const srsLevelSchema = z.enum([
  'APPRENTICE_1',  // 4 hours
  'APPRENTICE_2',  // 8 hours  
  'APPRENTICE_3',  // 1 day
  'APPRENTICE_4',  // 2 days
  'GURU_1',       // 1 week
  'GURU_2',       // 2 weeks
  'MASTER',       // 1 month
  'ENLIGHTENED',  // 4 months
  'BURNED'        // Never review again
]);
export type SRSLevel = z.infer<typeof srsLevelSchema>;

// Review result enum
export const reviewResultSchema = z.enum(['CORRECT', 'INCORRECT']);
export type ReviewResult = z.infer<typeof reviewResultSchema>;

// Kanji schema
export const kanjiSchema = z.object({
  id: z.number(),
  character: z.string(),
  meaning: z.string(),
  kun_reading: z.string().nullable(),
  on_reading: z.string().nullable(),
  jlpt_level: jlptLevelSchema,
  stroke_count: z.number().int(),
  created_at: z.coerce.date()
});
export type Kanji = z.infer<typeof kanjiSchema>;

// User progress schema - tracks individual user's progress on each kanji
export const userProgressSchema = z.object({
  id: z.number(),
  user_id: z.string(), // Simple string ID for users
  kanji_id: z.number(),
  srs_level: srsLevelSchema,
  next_review_at: z.coerce.date(),
  correct_streak: z.number().int(),
  incorrect_count: z.number().int(),
  last_reviewed_at: z.coerce.date().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});
export type UserProgress = z.infer<typeof userProgressSchema>;

// Review session schema - tracks individual review attempts
export const reviewSessionSchema = z.object({
  id: z.number(),
  user_id: z.string(),
  kanji_id: z.number(),
  result: reviewResultSchema,
  response_time_ms: z.number().int(), // Time taken to answer in milliseconds
  previous_srs_level: srsLevelSchema,
  new_srs_level: srsLevelSchema,
  created_at: z.coerce.date()
});
export type ReviewSession = z.infer<typeof reviewSessionSchema>;

// Input schemas for creating records
export const createKanjiInputSchema = z.object({
  character: z.string().length(1), // Kanji should be exactly one character
  meaning: z.string().min(1),
  kun_reading: z.string().nullable(),
  on_reading: z.string().nullable(),
  jlpt_level: jlptLevelSchema,
  stroke_count: z.number().int().positive()
});
export type CreateKanjiInput = z.infer<typeof createKanjiInputSchema>;

// Input schema for starting kanji study (adds to user's study list)
export const startKanjiStudyInputSchema = z.object({
  user_id: z.string().min(1),
  kanji_id: z.number()
});
export type StartKanjiStudyInput = z.infer<typeof startKanjiStudyInputSchema>;

// Input schema for submitting a review
export const submitReviewInputSchema = z.object({
  user_id: z.string().min(1),
  kanji_id: z.number(),
  result: reviewResultSchema,
  response_time_ms: z.number().int().positive()
});
export type SubmitReviewInput = z.infer<typeof submitReviewInputSchema>;

// Query schema for getting kanji by filters
export const getKanjiQuerySchema = z.object({
  jlpt_level: jlptLevelSchema.optional(),
  limit: z.number().int().positive().max(100).default(20),
  offset: z.number().int().nonnegative().default(0)
});
export type GetKanjiQuery = z.infer<typeof getKanjiQuerySchema>;

// Query schema for getting user's reviews due
export const getReviewsDueQuerySchema = z.object({
  user_id: z.string().min(1),
  limit: z.number().int().positive().max(50).default(10)
});
export type GetReviewsDueQuery = z.infer<typeof getReviewsDueQuerySchema>;

// Query schema for getting user statistics
export const getUserStatsQuerySchema = z.object({
  user_id: z.string().min(1),
  jlpt_level: jlptLevelSchema.optional()
});
export type GetUserStatsQuery = z.infer<typeof getUserStatsQuerySchema>;

// Response schema for user statistics
export const userStatsSchema = z.object({
  user_id: z.string(),
  total_kanji: z.number().int(),
  apprentice_count: z.number().int(),
  guru_count: z.number().int(),
  master_count: z.number().int(),
  enlightened_count: z.number().int(),
  burned_count: z.number().int(),
  reviews_due_count: z.number().int(),
  accuracy_percentage: z.number().min(0).max(100)
});
export type UserStats = z.infer<typeof userStatsSchema>;
