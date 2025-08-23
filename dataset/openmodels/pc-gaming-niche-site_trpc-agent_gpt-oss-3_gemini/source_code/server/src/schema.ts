// Zod schemas for the content-focused PC peripherals review site
import { z } from 'zod';

// ---------- Category ----------
export const categorySchema = z.object({
  id: z.number(),
  name: z.string(),
  created_at: z.coerce.date(),
});
export type Category = z.infer<typeof categorySchema>;

export const createCategoryInputSchema = z.object({
  name: z.string(),
});
export type CreateCategoryInput = z.infer<typeof createCategoryInputSchema>;

export const updateCategoryInputSchema = z.object({
  id: z.number(),
  name: z.string().optional(),
});
export type UpdateCategoryInput = z.infer<typeof updateCategoryInputSchema>;

// ---------- Product ----------
export const productSchema = z.object({
  id: z.number(),
  name: z.string(),
  category_id: z.number(),
  image_url: z.string().nullable(), // optional image can be null
  price: z.number(),
  specifications: z.string().nullable(), // free‑form specs as text
  created_at: z.coerce.date(),
});
export type Product = z.infer<typeof productSchema>;

export const createProductInputSchema = z.object({
  name: z.string(),
  category_id: z.number(),
  image_url: z.string().nullable().optional(),
  price: z.number().positive(),
  specifications: z.string().nullable().optional(),
});
export type CreateProductInput = z.infer<typeof createProductInputSchema>;

export const updateProductInputSchema = z.object({
  id: z.number(),
  name: z.string().optional(),
  category_id: z.number().optional(),
  image_url: z.string().nullable().optional(),
  price: z.number().positive().optional(),
  specifications: z.string().nullable().optional(),
});
export type UpdateProductInput = z.infer<typeof updateProductInputSchema>;

// ---------- Review ----------
export const reviewSchema = z.object({
  id: z.number(),
  product_id: z.number(),
  title: z.string(),
  content: z.string(),
  rating: z.number().int().min(1).max(5),
  pros: z.array(z.string()),
  cons: z.array(z.string()),
  created_at: z.coerce.date(),
});
export type Review = z.infer<typeof reviewSchema>;

export const createReviewInputSchema = z.object({
  product_id: z.number(),
  title: z.string(),
  content: z.string(),
  rating: z.number().int().min(1).max(5),
  pros: z.array(z.string()),
  cons: z.array(z.string()),
});
export type CreateReviewInput = z.infer<typeof createReviewInputSchema>;

export const updateReviewInputSchema = z.object({
  id: z.number(),
  title: z.string().optional(),
  content: z.string().optional(),
  rating: z.number().int().min(1).max(5).optional(),
  pros: z.array(z.string()).optional(),
  cons: z.array(z.string()).optional(),
});
export type UpdateReviewInput = z.infer<typeof updateReviewInputSchema>;
