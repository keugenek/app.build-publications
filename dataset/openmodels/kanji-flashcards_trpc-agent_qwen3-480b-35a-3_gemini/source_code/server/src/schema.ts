import { z } from 'zod';

// JLPT levels (1-5) - 1 is most advanced, 5 is beginner
export const jlptLevelEnum = z.enum(['N1', 'N2', 'N3', 'N4', 'N5']);

// Kanji schema
export const kanjiSchema = z.object({
  id: z.number(),
  kanji: z.string(), // The actual kanji character
  meaning: z.string(), // English meaning
  onyomi: z.string().nullable(), // Chinese reading
  kunyomi: z.string().nullable(), // Japanese reading
  jlpt_level: jlptLevelEnum,
  created_at: z.coerce.date(),
});

export type Kanji = z.infer<typeof kanjiSchema>;

// Input schema for creating kanji
export const createKanjiInputSchema = z.object({
  kanji: z.string(),
  meaning: z.string(),
  onyomi: z.string().nullable(),
  kunyomi: z.string().nullable(),
  jlpt_level: jlptLevelEnum,
});

export type CreateKanjiInput = z.infer<typeof createKanjiInputSchema>;

// Spaced Repetition System (SRS) entry schema
export const srsEntrySchema = z.object({
  id: z.number(),
  user_id: z.number(),
  kanji_id: z.number(),
  familiarity_level: z.number().int().min(0).max(5), // 0-5 scale
  next_review_date: z.coerce.date(),
  last_reviewed_at: z.coerce.date().nullable(),
  created_at: z.coerce.date(),
});

export type SrsEntry = z.infer<typeof srsEntrySchema>;

// Input schema for creating SRS entries
export const createSrsEntryInputSchema = z.object({
  user_id: z.number(),
  kanji_id: z.number(),
  familiarity_level: z.number().int().min(0).max(5).default(0),
  next_review_date: z.coerce.date(),
});

export type CreateSrsEntryInput = z.infer<typeof createSrsEntryInputSchema>;

// Input schema for updating SRS entries
export const updateSrsEntryInputSchema = z.object({
  id: z.number(),
  familiarity_level: z.number().int().min(0).max(5).optional(),
  next_review_date: z.coerce.date().optional(),
  last_reviewed_at: z.coerce.date().optional(),
});

export type UpdateSrsEntryInput = z.infer<typeof updateSrsEntryInputSchema>;

// Flashcard schema for practice sessions
export const flashcardSchema = z.object({
  id: z.number(),
  kanji: kanjiSchema,
  srs_entry: srsEntrySchema.nullable(),
});

export type Flashcard = z.infer<typeof flashcardSchema>;
