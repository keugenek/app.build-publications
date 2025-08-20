import { z } from 'zod';

// Reading status enum
export const readingStatusEnum = z.enum(['To Read', 'Reading', 'Finished']);
export type ReadingStatus = z.infer<typeof readingStatusEnum>;

// Book schema with proper field handling
export const bookSchema = z.object({
  id: z.number(),
  title: z.string(),
  author: z.string(),
  genre: z.string(),
  reading_status: readingStatusEnum,
  created_at: z.coerce.date(), // Automatically converts string timestamps to Date objects
  updated_at: z.coerce.date()
});

export type Book = z.infer<typeof bookSchema>;

// Input schema for creating books
export const createBookInputSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  author: z.string().min(1, 'Author is required'),
  genre: z.string().min(1, 'Genre is required'),
  reading_status: readingStatusEnum
});

export type CreateBookInput = z.infer<typeof createBookInputSchema>;

// Input schema for updating books
export const updateBookInputSchema = z.object({
  id: z.number(),
  title: z.string().min(1, 'Title is required').optional(),
  author: z.string().min(1, 'Author is required').optional(),
  genre: z.string().min(1, 'Genre is required').optional(),
  reading_status: readingStatusEnum.optional()
});

export type UpdateBookInput = z.infer<typeof updateBookInputSchema>;

// Input schema for filtering/searching books
export const searchBooksInputSchema = z.object({
  title: z.string().optional(),
  author: z.string().optional(),
  genre: z.string().optional(),
  reading_status: readingStatusEnum.optional()
});

export type SearchBooksInput = z.infer<typeof searchBooksInputSchema>;

// Input schema for getting a single book by ID
export const getBookInputSchema = z.object({
  id: z.number()
});

export type GetBookInput = z.infer<typeof getBookInputSchema>;

// Input schema for deleting a book
export const deleteBookInputSchema = z.object({
  id: z.number()
});

export type DeleteBookInput = z.infer<typeof deleteBookInputSchema>;
