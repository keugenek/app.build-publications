import { z } from 'zod';

// Reading status enum
export const readingStatusEnum = z.enum(['Read', 'Currently Reading', 'Want to Read']);
export type ReadingStatus = z.infer<typeof readingStatusEnum>;

// Book schema with proper field types
export const bookSchema = z.object({
  id: z.number(),
  title: z.string(),
  author: z.string(),
  genre: z.string(),
  reading_status: readingStatusEnum,
  created_at: z.coerce.date(),
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

// Query input schema for searching and filtering books
export const getBooksQuerySchema = z.object({
  search: z.string().optional(), // Search by title or author
  genre: z.string().optional(), // Filter by genre
  reading_status: readingStatusEnum.optional() // Filter by reading status
});

export type GetBooksQuery = z.infer<typeof getBooksQuerySchema>;

// Schema for deleting a book
export const deleteBookInputSchema = z.object({
  id: z.number()
});

export type DeleteBookInput = z.infer<typeof deleteBookInputSchema>;

// Response schema for successful operations
export const successResponseSchema = z.object({
  success: z.boolean(),
  message: z.string()
});

export type SuccessResponse = z.infer<typeof successResponseSchema>;
