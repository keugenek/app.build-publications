import { z } from 'zod';

// JLPT levels enum
export const jlptLevelSchema = z.enum(['N5', 'N4', 'N3', 'N2', 'N1']);

export type JLPTLevel = z.infer<typeof jlptLevelSchema>;

// Kanji schema
export const kanjiSchema = z.object({
  id: z.number(),
  character: z.string(),
  meaning: z.string(),
  kunReading: z.string().nullable(),
  onReading: z.string().nullable(),
  jlptLevel: jlptLevelSchema,
  created_at: z.coerce.date(),
});

export type Kanji = z.infer<typeof kanjiSchema>;

// Flashcard schema for SRS system
export const flashcardSchema = z.object({
  id: z.number(),
  kanjiId: z.number(),
  userId: z.string(),
  nextReviewDate: z.coerce.date(),
  interval: z.number(), // Days until next review
  easeFactor: z.number(), // Factor for spacing reviews
  repetitionCount: z.number(), // How many times reviewed
  lastReviewedAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
});

export type Flashcard = z.infer<typeof flashcardSchema>;

// User progress schema
export const userProgressSchema = z.object({
  id: z.number(),
  userId: z.string(),
  jlptLevel: jlptLevelSchema,
  masteredKanjiCount: z.number(),
  totalKanjiCount: z.number(),
  lastUpdated: z.coerce.date(),
});

export type UserProgress = z.infer<typeof userProgressSchema>;

// Input schema for creating kanji
export const createKanjiInputSchema = z.object({
  character: z.string(),
  meaning: z.string(),
  kunReading: z.string().nullable(),
  onReading: z.string().nullable(),
  jlptLevel: jlptLevelSchema,
});

export type CreateKanjiInput = z.infer<typeof createKanjiInputSchema>;

// Input schema for creating flashcard
export const createFlashcardInputSchema = z.object({
  kanjiId: z.number(),
  userId: z.string(),
});

export type CreateFlashcardInput = z.infer<typeof createFlashcardInputSchema>;

// Input schema for reviewing flashcard (SRS algorithm)
export const reviewFlashcardInputSchema = z.object({
  flashcardId: z.number(),
  quality: z.number().min(0).max(5), // 0-5 rating of recall quality
});

export type ReviewFlashcardInput = z.infer<typeof reviewFlashcardInputSchema>;

// Input schema for getting kanji by JLPT level
export const getKanjiByLevelInputSchema = z.object({
  jlptLevel: jlptLevelSchema,
});

export type GetKanjiByLevelInput = z.infer<typeof getKanjiByLevelInputSchema>;
