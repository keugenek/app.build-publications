import { z } from 'zod';

// Enum for reading status
export const readingStatusEnum = z.enum([
  'to_read',
  'currently_reading',
  'finished',
]);
export type ReadingStatus = z.infer<typeof readingStatusEnum>;

// Book output schema
export const bookSchema = z.object({
  id: z.number(),
  title: z.string(),
  author: z.string(),
  genre: z.string(),
  reading_status: readingStatusEnum,
  created_at: z.coerce.date(),
});
export type Book = z.infer<typeof bookSchema>;

// Input schema for creating a book
export const createBookInputSchema = z.object({
  title: z.string(),
  author: z.string(),
  genre: z.string(),
  reading_status: readingStatusEnum,
});
export type CreateBookInput = z.infer<typeof createBookInputSchema>;

// Input schema for updating a book (partial fields)
export const updateBookInputSchema = z.object({
  id: z.number(),
  title: z.string().optional(),
  author: z.string().optional(),
  genre: z.string().optional(),
  reading_status: readingStatusEnum.optional(),
});
export type UpdateBookInput = z.infer<typeof updateBookInputSchema>;

// Input schema for deleting a book
export const deleteBookInputSchema = z.object({
  id: z.number(),
});
export type DeleteBookInput = z.infer<typeof deleteBookInputSchema>;
