import { z } from 'zod';

// Enum for reading status
export const readingStatusEnum = ['To Read', 'Reading', 'Finished'] as const;
export const readingStatusSchema = z.enum(readingStatusEnum);

// Book schema representing a book record from the database
export const bookSchema = z.object({
  id: z.number(),
  title: z.string(),
  author: z.string(),
  genre: z.string(),
  reading_status: readingStatusSchema,
  created_at: z.coerce.date()
});

export type Book = z.infer<typeof bookSchema>;

// Input schema for creating a new book
export const createBookInputSchema = z.object({
  title: z.string(),
  author: z.string(),
  genre: z.string(),
  reading_status: readingStatusSchema
});

export type CreateBookInput = z.infer<typeof createBookInputSchema>;

// Input schema for updating an existing book
export const updateBookInputSchema = z.object({
  id: z.number(),
  title: z.string().optional(),
  author: z.string().optional(),
  genre: z.string().optional(),
  reading_status: readingStatusSchema.optional()
});

export type UpdateBookInput = z.infer<typeof updateBookInputSchema>;

// Input schema for searching/filtering books
export const searchBooksInputSchema = z.object({
  title: z.string().optional(),
  author: z.string().optional(),
  genre: z.string().optional(),
  reading_status: readingStatusSchema.optional()
});

export type SearchBooksInput = z.infer<typeof searchBooksInputSchema>;
