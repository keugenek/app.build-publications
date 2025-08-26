import { z } from 'zod';

// User schema (output)
export const userSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  created_at: z.coerce.date()
});
export type User = z.infer<typeof userSchema>;

// Input schema for creating a user (registration)
export const createUserInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8) // simple password rule
});
export type CreateUserInput = z.infer<typeof createUserInputSchema>;

// Input schema for login
export const loginInputSchema = z.object({
  email: z.string().email(),
  password: z.string()
});
export type LoginInput = z.infer<typeof loginInputSchema>;

// Kanji schema (output)
export const kanjiSchema = z.object({
  id: z.number(),
  character: z.string(),
  meaning: z.string(),
  onyomi: z.string(),
  kunyomi: z.string(),
  jlpt_level: z.number().int(),
  created_at: z.coerce.date()
});
export type Kanji = z.infer<typeof kanjiSchema>;

// Input schema for creating a kanji entry
export const createKanjiInputSchema = z.object({
  character: z.string(),
  meaning: z.string(),
  onyomi: z.string(),
  kunyomi: z.string(),
  jlpt_level: z.number().int().min(1).max(5) // JLPT levels 1-5 (N1=1, N5=5)
});
export type CreateKanjiInput = z.infer<typeof createKanjiInputSchema>;

// Input schema for fetching kanjis by JLPT level
export const kanjisByLevelInputSchema = z.object({
  jlpt_level: z.number().int().min(1).max(5)
});
export type KanjisByLevelInput = z.infer<typeof kanjisByLevelInputSchema>;

// Input schema for recording an answer
export const recordAnswerInputSchema = z.object({
  user_id: z.number(),
  kanji_id: z.number(),
  correct: z.boolean()
});
export type RecordAnswerInput = z.infer<typeof recordAnswerInputSchema>;

// Progress schema (output)
export const progressSchema = z.object({
  user_id: z.number(),
  kanji_id: z.number(),
  correct_count: z.number().int().nonnegative(),
  incorrect_count: z.number().int().nonnegative(),
  last_reviewed: z.coerce.date(),
  next_review: z.coerce.date().optional()
});
export type Progress = z.infer<typeof progressSchema>;
