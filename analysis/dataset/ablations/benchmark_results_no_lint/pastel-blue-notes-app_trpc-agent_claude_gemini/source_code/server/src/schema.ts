import { z } from 'zod';

// User schema
export const userSchema = z.object({
  id: z.number(),
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

// Input schema for user registration
export const registerUserInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export type RegisterUserInput = z.infer<typeof registerUserInputSchema>;

// Input schema for user login
export const loginUserInputSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

export type LoginUserInput = z.infer<typeof loginUserInputSchema>;

// Input schema for creating categories
export const createCategoryInputSchema = z.object({
  name: z.string().min(1),
  user_id: z.number()
});

export type CreateCategoryInput = z.infer<typeof createCategoryInputSchema>;

// Input schema for updating categories
export const updateCategoryInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  user_id: z.number()
});

export type UpdateCategoryInput = z.infer<typeof updateCategoryInputSchema>;

// Input schema for creating notes
export const createNoteInputSchema = z.object({
  title: z.string().min(1),
  content: z.string(),
  user_id: z.number(),
  category_id: z.number().nullable().optional()
});

export type CreateNoteInput = z.infer<typeof createNoteInputSchema>;

// Input schema for updating notes
export const updateNoteInputSchema = z.object({
  id: z.number(),
  title: z.string().min(1).optional(),
  content: z.string().optional(),
  user_id: z.number(),
  category_id: z.number().nullable().optional()
});

export type UpdateNoteInput = z.infer<typeof updateNoteInputSchema>;

// Input schema for getting user's notes
export const getUserNotesInputSchema = z.object({
  user_id: z.number(),
  category_id: z.number().optional()
});

export type GetUserNotesInput = z.infer<typeof getUserNotesInputSchema>;

// Input schema for getting user's categories
export const getUserCategoriesInputSchema = z.object({
  user_id: z.number()
});

export type GetUserCategoriesInput = z.infer<typeof getUserCategoriesInputSchema>;

// Input schema for deleting notes
export const deleteNoteInputSchema = z.object({
  id: z.number(),
  user_id: z.number()
});

export type DeleteNoteInput = z.infer<typeof deleteNoteInputSchema>;

// Input schema for deleting categories
export const deleteCategoryInputSchema = z.object({
  id: z.number(),
  user_id: z.number()
});

export type DeleteCategoryInput = z.infer<typeof deleteCategoryInputSchema>;
