import { z } from 'zod';

// Book schema with proper numeric handling
export const bookSchema = z.object({
  id: z.number(),
  title: z.string(),
  author: z.string(),
  genre: z.string(),
  status: z.enum(['to-read', 'reading', 'completed']),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Book = z.infer<typeof bookSchema>;

// Input schema for creating books
export const createBookInputSchema = z.object({
  title: z.string().min(1, "Title is required"),
  author: z.string().min(1, "Author is required"),
  genre: z.string().min(1, "Genre is required"),
  status: z.enum(['to-read', 'reading', 'completed'])
});

export type CreateBookInput = z.infer<typeof createBookInputSchema>;

// Input schema for updating books
export const updateBookInputSchema = z.object({
  id: z.number(),
  title: z.string().min(1, "Title is required").optional(),
  author: z.string().min(1, "Author is required").optional(),
  genre: z.string().min(1, "Genre is required").optional(),
  status: z.enum(['to-read', 'reading', 'completed']).optional()
});

export type UpdateBookInput = z.infer<typeof updateBookInputSchema>;

// Input schema for deleting books
export const deleteBookInputSchema = z.object({
  id: z.number()
});

export type DeleteBookInput = z.infer<typeof deleteBookInputSchema>;

// Input schema for filtering books
export const filterBooksInputSchema = z.object({
  search: z.string().optional(),
  genre: z.string().optional(),
  status: z.enum(['to-read', 'reading', 'completed']).optional()
});

export type FilterBooksInput = z.infer<typeof filterBooksInputSchema>;
