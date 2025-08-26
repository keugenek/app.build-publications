import { z } from 'zod';

// JLPT Level enum
export const jlptLevelSchema = z.enum(['N5', 'N4', 'N3', 'N2', 'N1']);
export type JlptLevel = z.infer<typeof jlptLevelSchema>;

// Kanji schema
export const kanjiSchema = z.object({
  id: z.number(),
  character: z.string(),
  meaning: z.string(),
  kun_reading: z.string().nullable(),
  on_reading: z.string().nullable(),
  romaji: z.string().nullable(),
  jlpt_level: jlptLevelSchema,
  created_at: z.coerce.date()
});

export type Kanji = z.infer<typeof kanjiSchema>;

// User progress schema with SRS data
export const userProgressSchema = z.object({
  id: z.number(),
  user_id: z.string(), // Simple string identifier for user
  kanji_id: z.number(),
  correct_count: z.number().int().nonnegative(),
  incorrect_count: z.number().int().nonnegative(),
  current_interval: z.number().int().nonnegative(), // Days between reviews
  ease_factor: z.number(), // SRS ease factor (typically 2.5 initial)
  next_review_date: z.coerce.date(),
  last_reviewed_at: z.coerce.date().nullable(),
  created_at: z.coerce.date()
});

export type UserProgress = z.infer<typeof userProgressSchema>;

// Input schema for creating kanji
export const createKanjiInputSchema = z.object({
  character: z.string().min(1),
  meaning: z.string().min(1),
  kun_reading: z.string().nullable(),
  on_reading: z.string().nullable(),
  romaji: z.string().nullable(),
  jlpt_level: jlptLevelSchema
});

export type CreateKanjiInput = z.infer<typeof createKanjiInputSchema>;

// Input schema for updating kanji
export const updateKanjiInputSchema = z.object({
  id: z.number(),
  character: z.string().min(1).optional(),
  meaning: z.string().min(1).optional(),
  kun_reading: z.string().nullable().optional(),
  on_reading: z.string().nullable().optional(),
  romaji: z.string().nullable().optional(),
  jlpt_level: jlptLevelSchema.optional()
});

export type UpdateKanjiInput = z.infer<typeof updateKanjiInputSchema>;

// Input schema for answering flashcard
export const answerFlashcardInputSchema = z.object({
  user_id: z.string(),
  kanji_id: z.number(),
  is_correct: z.boolean()
});

export type AnswerFlashcardInput = z.infer<typeof answerFlashcardInputSchema>;

// Input schema for getting user's due reviews
export const getDueReviewsInputSchema = z.object({
  user_id: z.string(),
  jlpt_level: jlptLevelSchema.optional(), // Optional filter by JLPT level
  limit: z.number().int().positive().optional().default(20) // Default 20 cards
});

export type GetDueReviewsInput = z.infer<typeof getDueReviewsInputSchema>;

// Schema for kanji with user progress (for flashcard display)
export const kanjiWithProgressSchema = z.object({
  id: z.number(),
  character: z.string(),
  meaning: z.string(),
  kun_reading: z.string().nullable(),
  on_reading: z.string().nullable(),
  romaji: z.string().nullable(),
  jlpt_level: jlptLevelSchema,
  created_at: z.coerce.date(),
  progress: userProgressSchema.nullable() // May not exist for new kanji
});

export type KanjiWithProgress = z.infer<typeof kanjiWithProgressSchema>;
