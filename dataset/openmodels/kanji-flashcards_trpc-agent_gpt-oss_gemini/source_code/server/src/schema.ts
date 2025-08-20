import { z } from 'zod';

// Kanji schema representing a single kanji character
export const kanjiSchema = z.object({
  id: z.number(),
  character: z.string(),
  meaning: z.string(),
  reading: z.string(),
  jlpt_level: z.number().int(),
  created_at: z.coerce.date()
});

export type Kanji = z.infer<typeof kanjiSchema>;

// Input schema for creating a new kanji
export const createKanjiInputSchema = z.object({
  character: z.string(),
  meaning: z.string(),
  reading: z.string(),
  jlpt_level: z.number().int().min(1).max(5) // JLPT levels 1-5
});

export type CreateKanjiInput = z.infer<typeof createKanjiInputSchema>;

// Input schema for updating an existing kanji
export const updateKanjiInputSchema = z.object({
  id: z.number(),
  character: z.string().optional(),
  meaning: z.string().optional(),
  reading: z.string().optional(),
  jlpt_level: z.number().int().optional()
});

export type UpdateKanjiInput = z.infer<typeof updateKanjiInputSchema>;

// Progress schema tracking a user's spaced repetition schedule for a kanji
export const progressSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  kanji_id: z.number(),
  next_review: z.coerce.date(),
  interval_days: z.number().int(),
  easiness_factor: z.number(), // Typically between 1.3 and 2.5
  created_at: z.coerce.date()
});

export type Progress = z.infer<typeof progressSchema>;

// Input schema for creating a progress record
export const createProgressInputSchema = z.object({
  user_id: z.number(),
  kanji_id: z.number(),
  next_review: z.coerce.date(),
  interval_days: z.number().int(),
  easiness_factor: z.number()
});

export type CreateProgressInput = z.infer<typeof createProgressInputSchema>;

// Input schema for updating a progress record
export const updateProgressInputSchema = z.object({
  id: z.number(),
  next_review: z.coerce.date().optional(),
  interval_days: z.number().int().optional(),
  easiness_factor: z.number().optional()
});

export type UpdateProgressInput = z.infer<typeof updateProgressInputSchema>;
