import { z } from 'zod';

// Product schema for PC gaming peripherals
export const productSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  price: z.number().nullable(),
  category_id: z.number(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

export type Product = z.infer<typeof productSchema>;

// Category schema for product categories
export const categorySchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

export type Category = z.infer<typeof categorySchema>;

// Review schema for product reviews
export const reviewSchema = z.object({
  id: z.number(),
  product_id: z.number(),
  title: z.string(),
  content: z.string(),
  rating: z.number().min(1).max(5),
  pros: z.string().nullable(),
  cons: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

export type Review = z.infer<typeof reviewSchema>;

// Input schema for creating products
export const createProductInputSchema = z.object({
  name: z.string(),
  description: z.string().nullable(),
  price: z.number().nullable(),
  category_id: z.number(),
});

export type CreateProductInput = z.infer<typeof createProductInputSchema>;

// Input schema for creating categories
export const createCategoryInputSchema = z.object({
  name: z.string(),
  description: z.string().nullable(),
});

export type CreateCategoryInput = z.infer<typeof createCategoryInputSchema>;

// Input schema for creating reviews
export const createReviewInputSchema = z.object({
  product_id: z.number(),
  title: z.string(),
  content: z.string(),
  rating: z.number().min(1).max(5),
  pros: z.string().nullable(),
  cons: z.string().nullable(),
});

export type CreateReviewInput = z.infer<typeof createReviewInputSchema>;

// Input schema for updating products
export const updateProductInputSchema = z.object({
  id: z.number(),
  name: z.string().optional(),
  description: z.string().nullable().optional(),
  price: z.number().nullable().optional(),
  category_id: z.number().optional(),
});

export type UpdateProductInput = z.infer<typeof updateProductInputSchema>;

// Input schema for updating categories
export const updateCategoryInputSchema = z.object({
  id: z.number(),
  name: z.string().optional(),
  description: z.string().nullable().optional(),
});

export type UpdateCategoryInput = z.infer<typeof updateCategoryInputSchema>;

// Input schema for updating reviews
export const updateReviewInputSchema = z.object({
  id: z.number(),
  product_id: z.number().optional(),
  title: z.string().optional(),
  content: z.string().optional(),
  rating: z.number().min(1).max(5).optional(),
  pros: z.string().nullable().optional(),
  cons: z.string().nullable().optional(),
});

export type UpdateReviewInput = z.infer<typeof updateReviewInputSchema>;
