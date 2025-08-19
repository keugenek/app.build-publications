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
  color: z.string().nullable(), // Optional pastel color for category
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
  category_id: z.number().nullable(), // Notes can exist without a category
  user_id: z.number(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Note = z.infer<typeof noteSchema>;

// Input schemas for authentication
export const registerInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

export type RegisterInput = z.infer<typeof registerInputSchema>;

export const loginInputSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

export type LoginInput = z.infer<typeof loginInputSchema>;

// Input schemas for categories
export const createCategoryInputSchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  color: z.string().nullable().optional(),
  user_id: z.number()
});

export type CreateCategoryInput = z.infer<typeof createCategoryInputSchema>;

export const updateCategoryInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1, 'Category name is required').optional(),
  color: z.string().nullable().optional(),
  user_id: z.number()
});

export type UpdateCategoryInput = z.infer<typeof updateCategoryInputSchema>;

// Input schemas for notes
export const createNoteInputSchema = z.object({
  title: z.string().min(1, 'Note title is required'),
  content: z.string(),
  category_id: z.number().nullable().optional(),
  user_id: z.number()
});

export type CreateNoteInput = z.infer<typeof createNoteInputSchema>;

export const updateNoteInputSchema = z.object({
  id: z.number(),
  title: z.string().min(1, 'Note title is required').optional(),
  content: z.string().optional(),
  category_id: z.number().nullable().optional(),
  user_id: z.number()
});

export type UpdateNoteInput = z.infer<typeof updateNoteInputSchema>;

// Authentication response schema
export const authResponseSchema = z.object({
  user: userSchema.omit({ password_hash: true }),
  token: z.string().optional() // JWT token for session management
});

export type AuthResponse = z.infer<typeof authResponseSchema>;
