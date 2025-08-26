import { z } from 'zod';

// User schema
export const userSchema = z.object({
  id: z.number(),
  username: z.string(),
  email: z.string().email(),
  password_hash: z.string(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type User = z.infer<typeof userSchema>;

// Category schema
export const categorySchema = z.object({
  id: z.number(),
  name: z.string(),
  user_id: z.number(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Category = z.infer<typeof categorySchema>;

// Note schema
export const noteSchema = z.object({
  id: z.number(),
  title: z.string(),
  content: z.string(),
  user_id: z.number(),
  category_id: z.number().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Note = z.infer<typeof noteSchema>;

// Input schemas for user operations
export const createUserInputSchema = z.object({
  username: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6)
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

export const loginUserInputSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

export type LoginUserInput = z.infer<typeof loginUserInputSchema>;

// Input schemas for category operations
export const createCategoryInputSchema = z.object({
  name: z.string().min(1),
  user_id: z.number()
});

export type CreateCategoryInput = z.infer<typeof createCategoryInputSchema>;

export const updateCategoryInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  user_id: z.number()
});

export type UpdateCategoryInput = z.infer<typeof updateCategoryInputSchema>;

// Input schemas for note operations
export const createNoteInputSchema = z.object({
  title: z.string().min(1),
  content: z.string(),
  user_id: z.number(),
  category_id: z.number().nullable().optional()
});

export type CreateNoteInput = z.infer<typeof createNoteInputSchema>;

export const updateNoteInputSchema = z.object({
  id: z.number(),
  title: z.string().min(1).optional(),
  content: z.string().optional(),
  user_id: z.number(),
  category_id: z.number().nullable().optional()
});

export type UpdateNoteInput = z.infer<typeof updateNoteInputSchema>;

export const getNotesByUserInputSchema = z.object({
  user_id: z.number()
});

export type GetNotesByUserInput = z.infer<typeof getNotesByUserInputSchema>;

export const getNotesByCategoryInputSchema = z.object({
  user_id: z.number(),
  category_id: z.number().nullable()
});

export type GetNotesByCategoryInput = z.infer<typeof getNotesByCategoryInputSchema>;

export const deleteNoteInputSchema = z.object({
  id: z.number(),
  user_id: z.number()
});

export type DeleteNoteInput = z.infer<typeof deleteNoteInputSchema>;

export const deleteCategoryInputSchema = z.object({
  id: z.number(),
  user_id: z.number()
});

export type DeleteCategoryInput = z.infer<typeof deleteCategoryInputSchema>;
