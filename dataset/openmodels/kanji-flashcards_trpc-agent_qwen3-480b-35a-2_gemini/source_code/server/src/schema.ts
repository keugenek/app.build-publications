import { z } from 'zod';

// JLPT Level enum
export const jlptLevelSchema = z.enum(['N5', 'N4', 'N3', 'N2', 'N1']);

export type JLPTLevel = z.infer<typeof jlptLevelSchema>;

// Kanji schema
export const kanjiSchema = z.object({
  id: z.number(),
  character: z.string(),
  meaning: z.string(),
  kunyomi: z.string().nullable(),
  onyomi: z.string().nullable(),
  jlpt_level: jlptLevelSchema,
  created_at: z.coerce.date(),
});

export type Kanji = z.infer<typeof kanjiSchema>;

// SRS Entry schema
export const srsEntrySchema = z.object({
  id: z.number(),
  user_id: z.string(),
  kanji_id: z.number(),
  ease: z.number(), // How easy the user finds this kanji (1-4)
  interval: z.number(), // Days until next review
  due_date: z.coerce.date(), // When the next review is due
  last_reviewed: z.coerce.date().nullable(),
  review_count: z.number(),
  created_at: z.coerce.date(),
});

export type SRSEntry = z.infer<typeof srsEntrySchema>;

// Input schema for creating kanji
export const createKanjiInputSchema = z.object({
  character: z.string(),
  meaning: z.string(),
  kunyomi: z.string().nullable(),
  onyomi: z.string().nullable(),
  jlpt_level: jlptLevelSchema,
});

export type CreateKanjiInput = z.infer<typeof createKanjiInputSchema>;

// Input schema for creating SRS entries
export const createSRSEntryInputSchema = z.object({
  user_id: z.string(),
  kanji_id: z.number(),
  ease: z.number().min(1).max(4),
  interval: z.number().nonnegative(),
  due_date: z.coerce.date(),
});

export type CreateSRSEntryInput = z.infer<typeof createSRSEntryInputSchema>;

// Input schema for updating SRS entries (after review)
export const updateSRSEntryInputSchema = z.object({
  id: z.number(),
  ease: z.number().min(1).max(4),
  interval: z.number().nonnegative(),
  due_date: z.coerce.date(),
  last_reviewed: z.coerce.date(),
  review_count: z.number(),
});

export type UpdateSRSEntryInput = z.infer<typeof updateSRSEntryInputSchema>;

// Schema for fetching due kanji for review
export const dueKanjiSchema = z.object({
  kanji: kanjiSchema,
  srs_entry: srsEntrySchema,
});

export type DueKanji = z.infer<typeof dueKanjiSchema>;