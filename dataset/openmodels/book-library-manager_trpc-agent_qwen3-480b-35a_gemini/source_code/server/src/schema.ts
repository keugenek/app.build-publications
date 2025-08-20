import { z } from 'zod';

// Define the book status enum
export const bookStatusEnum = z.enum(['to_read', 'reading', 'completed']);

export type BookStatus = z.infer<typeof bookStatusEnum>;

// Book schema with proper type definitions
export const bookSchema = z.object({
  id: z.number(),
  title: z.string(),
  author: z.string(),
  genre: z.string().nullable(),
  status: bookStatusEnum,
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Book = z.infer<typeof bookSchema>;

// Input schema for creating books
export const createBookInputSchema = z.object({
  title: z.string().min(1, "Title is required"),
  author: z.string().min(1, "Author is required"),
  genre: z.string().nullable(),
  status: bookStatusEnum
});

export type CreateBookInput = z.infer<typeof createBookInputSchema>;

// Input schema for updating books
export const updateBookInputSchema = z.object({
  id: z.number(),
  title: z.string().min(1, "Title is required").optional(),
  author: z.string().min(1, "Author is required").optional(),
  genre: z.string().nullable().optional(),
  status: bookStatusEnum.optional()
});

export type UpdateBookInput = z.infer<typeof updateBookInputSchema>;

// Input schema for deleting books
export const deleteBookInputSchema = z.object({
  id: z.number()
});

export type DeleteBookInput = z.infer<typeof deleteBookInputSchema>;
