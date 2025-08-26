import { z } from 'zod';

// Reading status enum
export const readingStatusSchema = z.enum(['To Read', 'Reading', 'Finished']);
export type ReadingStatus = z.infer<typeof readingStatusSchema>;

// Book schema with proper field handling
export const bookSchema = z.object({
  id: z.number(),
  title: z.string(),
  author: z.string(),
  genre: z.string(),
  reading_status: readingStatusSchema,
  created_at: z.coerce.date(), // Automatically converts string timestamps to Date objects
  updated_at: z.coerce.date()
});

export type Book = z.infer<typeof bookSchema>;

// Input schema for creating books
export const createBookInputSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  author: z.string().min(1, 'Author is required'),
  genre: z.string().min(1, 'Genre is required'),
  reading_status: readingStatusSchema.default('To Read')
});

export type CreateBookInput = z.infer<typeof createBookInputSchema>;

// Input schema for updating books
export const updateBookInputSchema = z.object({
  id: z.number(),
  title: z.string().min(1, 'Title is required').optional(),
  author: z.string().min(1, 'Author is required').optional(),
  genre: z.string().min(1, 'Genre is required').optional(),
  reading_status: readingStatusSchema.optional()
});

export type UpdateBookInput = z.infer<typeof updateBookInputSchema>;

// Input schema for filtering books
export const filterBooksInputSchema = z.object({
  search: z.string().optional(), // Search by title or author
  genre: z.string().optional(), // Filter by specific genre
  reading_status: readingStatusSchema.optional() // Filter by reading status
});

export type FilterBooksInput = z.infer<typeof filterBooksInputSchema>;

// Input schema for deleting books
export const deleteBookInputSchema = z.object({
  id: z.number()
});

export type DeleteBookInput = z.infer<typeof deleteBookInputSchema>;

// Input schema for getting a single book
export const getBookInputSchema = z.object({
  id: z.number()
});

export type GetBookInput = z.infer<typeof getBookInputSchema>;
