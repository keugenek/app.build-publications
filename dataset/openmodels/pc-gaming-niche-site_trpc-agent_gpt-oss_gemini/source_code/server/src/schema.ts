import { z } from 'zod';

// Category schema (output)
export const categorySchema = z.object({
  id: z.number(),
  name: z.string(),
  created_at: z.coerce.date(),
});
export type Category = z.infer<typeof categorySchema>;

// Input schema for creating a category
export const createCategoryInputSchema = z.object({
  name: z.string(),
});
export type CreateCategoryInput = z.infer<typeof createCategoryInputSchema>;

// Input schema for updating a category
export const updateCategoryInputSchema = z.object({
  id: z.number(),
  name: z.string().optional(),
});
export type UpdateCategoryInput = z.infer<typeof updateCategoryInputSchema>;

// Review schema (output)
export const reviewSchema = z.object({
  id: z.number(),
  title: z.string(),
  brand: z.string(),
  model: z.string(),
  rating: z.number().int().min(1).max(5),
  summary: z.string(),
  body: z.string(),
  category_id: z.number(),
  created_at: z.coerce.date(),
});
export type Review = z.infer<typeof reviewSchema>;

// Input schema for creating a review
export const createReviewInputSchema = z.object({
  title: z.string(),
  brand: z.string(),
  model: z.string(),
  rating: z.number().int().min(1).max(5),
  summary: z.string(),
  body: z.string(),
  category_id: z.number(),
});
export type CreateReviewInput = z.infer<typeof createReviewInputSchema>;

// Input schema for updating a review
export const updateReviewInputSchema = z.object({
  id: z.number(),
  title: z.string().optional(),
  brand: z.string().optional(),
  model: z.string().optional(),
  rating: z.number().int().min(1).max(5).optional(),
  summary: z.string().optional(),
  body: z.string().optional(),
  category_id: z.number().optional(),
});
export type UpdateReviewInput = z.infer<typeof updateReviewInputSchema>;
