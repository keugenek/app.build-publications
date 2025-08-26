import { z } from 'zod';

// Category schema
export const categorySchema = z.object({
  id: z.number(),
  name: z.string(),
  created_at: z.coerce.date()
});

export type Category = z.infer<typeof categorySchema>;

// Review schema
export const reviewSchema = z.object({
  id: z.number(),
  title: z.string(),
  content: z.string(),
  category_id: z.number(),
  published: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Review = z.infer<typeof reviewSchema>;

// User schema
export const userSchema = z.object({
  id: z.number(),
  username: z.string(),
  password_hash: z.string(), // We'll hash passwords
  created_at: z.coerce.date()
});

export type User = z.infer<typeof userSchema>;

// Input schema for creating categories
export const createCategoryInputSchema = z.object({
  name: z.string().min(1, "Category name is required")
});

export type CreateCategoryInput = z.infer<typeof createCategoryInputSchema>;

// Input schema for updating categories
export const updateCategoryInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1, "Category name is required").optional()
});

export type UpdateCategoryInput = z.infer<typeof updateCategoryInputSchema>;

// Input schema for creating reviews
export const createReviewInputSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  category_id: z.number(),
  published: z.boolean().default(false)
});

export type CreateReviewInput = z.infer<typeof createReviewInputSchema>;

// Input schema for updating reviews
export const updateReviewInputSchema = z.object({
  id: z.number(),
  title: z.string().min(1, "Title is required").optional(),
  content: z.string().min(1, "Content is required").optional(),
  category_id: z.number().optional(),
  published: z.boolean().optional()
});

export type UpdateReviewInput = z.infer<typeof updateReviewInputSchema>;

// Input schema for user login
export const loginInputSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required")
});

export type LoginInput = z.infer<typeof loginInputSchema>;

// Input schema for user registration
export const registerInputSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(6, "Password must be at least 6 characters")
});

export type RegisterInput = z.infer<typeof registerInputSchema>;
