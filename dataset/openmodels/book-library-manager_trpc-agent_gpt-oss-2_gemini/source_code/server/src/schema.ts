import { z } from 'zod';

// Enum for reading status
export const readingStatusEnum = z.enum(['To Read', 'Reading', 'Read']);

// Output schema for a book record
export const bookSchema = z.object({
  id: z.number(),
  title: z.string(),
  author: z.string(),
  genre: z.string(),
  reading_status: readingStatusEnum,
  created_at: z.coerce.date(), // timestamp from DB converted to Date
});

export type Book = z.infer<typeof bookSchema>;

// Input schema for creating a new book
export const createBookInputSchema = z.object({
  title: z.string(),
  author: z.string(),
  genre: z.string(),
  reading_status: readingStatusEnum,
});

export type CreateBookInput = z.infer<typeof createBookInputSchema>;

// Input schema for updating an existing book
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
