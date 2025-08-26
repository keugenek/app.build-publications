import { z } from 'zod';

// User schema
export const userSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  password_hash: z.string(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

export type User = z.infer<typeof userSchema>;

// Category schema
export const categorySchema = z.object({
  id: z.number(),
  name: z.string().min(1).max(50),
  user_id: z.number(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

export type Category = z.infer<typeof categorySchema>;

// Note schema
export const noteSchema = z.object({
  id: z.number(),
  title: z.string().min(1).max(100),
  content: z.string(),
  user_id: z.number(),
  category_id: z.number().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

export type Note = z.infer<typeof noteSchema>;

// Input schemas
export const createUserInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

export const createCategoryInputSchema = z.object({
  name: z.string().min(1).max(50),
});

export type CreateCategoryInput = z.infer<typeof createCategoryInputSchema>;

export const updateCategoryInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).max(50),
});

export type UpdateCategoryInput = z.infer<typeof updateCategoryInputSchema>;

export const createNoteInputSchema = z.object({
  title: z.string().min(1).max(100),
  content: z.string(),
  category_id: z.number().nullable().optional(),
});

export type CreateNoteInput = z.infer<typeof createNoteInputSchema>;

export const updateNoteInputSchema = z.object({
  id: z.number(),
  title: z.string().min(1).max(100).optional(),
  content: z.string().optional(),
  category_id: z.number().nullable().optional(),
});

export type UpdateNoteInput = z.infer<typeof updateNoteInputSchema>;

export const loginInputSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export type LoginInput = z.infer<typeof loginInputSchema>;
