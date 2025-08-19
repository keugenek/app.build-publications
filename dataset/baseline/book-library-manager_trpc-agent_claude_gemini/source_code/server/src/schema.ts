import { z } from 'zod';

// Reading status enum
export const readingStatusEnum = z.enum(['To Read', 'Reading', 'Finished']);
export type ReadingStatus = z.infer<typeof readingStatusEnum>;

// Book schema with proper type handling
export const bookSchema = z.object({
  id: z.number(),
  title: z.string(),
  author: z.string(),
  genre: z.string(),
  reading_status: readingStatusEnum,
  isbn: z.string().nullable(), // ISBN is optional
  pages: z.number().int().nullable(), // Page count is optional
  publication_year: z.number().int().nullable(), // Publication year is optional
  notes: z.string().nullable(), // Personal notes are optional
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Book = z.infer<typeof bookSchema>;

// Input schema for creating books
export const createBookInputSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  author: z.string().min(1, 'Author is required'),
  genre: z.string().min(1, 'Genre is required'),
  reading_status: readingStatusEnum.default('To Read'),
  isbn: z.string().nullable().optional(),
  pages: z.number().int().positive().nullable().optional(),
  publication_year: z.number().int().min(1000).max(new Date().getFullYear()).nullable().optional(),
  notes: z.string().nullable().optional()
});

export type CreateBookInput = z.infer<typeof createBookInputSchema>;

// Input schema for updating books
export const updateBookInputSchema = z.object({
  id: z.number(),
  title: z.string().min(1, 'Title is required').optional(),
  author: z.string().min(1, 'Author is required').optional(),
  genre: z.string().min(1, 'Genre is required').optional(),
  reading_status: readingStatusEnum.optional(),
  isbn: z.string().nullable().optional(),
  pages: z.number().int().positive().nullable().optional(),
  publication_year: z.number().int().min(1000).max(new Date().getFullYear()).nullable().optional(),
  notes: z.string().nullable().optional()
});

export type UpdateBookInput = z.infer<typeof updateBookInputSchema>;

// Schema for search/filter parameters
export const searchBooksInputSchema = z.object({
  query: z.string().optional(), // General search query for title, author, or genre
  title: z.string().optional(), // Specific title filter
  author: z.string().optional(), // Specific author filter
  genre: z.string().optional(), // Specific genre filter
  reading_status: readingStatusEnum.optional(), // Filter by reading status
  limit: z.number().int().positive().max(100).default(50).optional(),
  offset: z.number().int().nonnegative().default(0).optional()
});

export type SearchBooksInput = z.infer<typeof searchBooksInputSchema>;

// Schema for deleting a book
export const deleteBookInputSchema = z.object({
  id: z.number()
});

export type DeleteBookInput = z.infer<typeof deleteBookInputSchema>;

// Schema for getting a single book by ID
export const getBookInputSchema = z.object({
  id: z.number()
});

export type GetBookInput = z.infer<typeof getBookInputSchema>;
