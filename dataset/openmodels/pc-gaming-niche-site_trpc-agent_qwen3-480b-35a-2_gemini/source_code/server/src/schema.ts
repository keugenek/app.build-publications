import { z } from 'zod';

// Category schema
export const categorySchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  created_at: z.coerce.date(),
});

export type Category = z.infer<typeof categorySchema>;

// Product schema
export const productSchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  price: z.number(),
  category_id: z.number(),
  image_url: z.string().nullable(),
  created_at: z.coerce.date(),
});

export type Product = z.infer<typeof productSchema>;

// Article schema
export const articleSchema = z.object({
  id: z.number(),
  title: z.string(),
  slug: z.string(),
  content: z.string(),
  excerpt: z.string().nullable(),
  image_url: z.string().nullable(),
  published: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

export type Article = z.infer<typeof articleSchema>;

// Input schemas for creation
export const createCategoryInputSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().nullable(),
});

export type CreateCategoryInput = z.infer<typeof createCategoryInputSchema>;

export const createProductInputSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().nullable(),
  price: z.number().positive(),
  category_id: z.number(),
  image_url: z.string().nullable(),
});

export type CreateProductInput = z.infer<typeof createProductInputSchema>;

export const createArticleInputSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  content: z.string().min(1),
  excerpt: z.string().nullable(),
  image_url: z.string().nullable(),
  published: z.boolean(),
});

export type CreateArticleInput = z.infer<typeof createArticleInputSchema>;

// Input schemas for updates
export const updateCategoryInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
});

export type UpdateCategoryInput = z.infer<typeof updateCategoryInputSchema>;

export const updateProductInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  price: z.number().positive().optional(),
  category_id: z.number().optional(),
  image_url: z.string().nullable().optional(),
});

export type UpdateProductInput = z.infer<typeof updateProductInputSchema>;

export const updateArticleInputSchema = z.object({
  id: z.number(),
  title: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  excerpt: z.string().nullable().optional(),
  image_url: z.string().nullable().optional(),
  published: z.boolean().optional(),
});

export type UpdateArticleInput = z.infer<typeof updateArticleInputSchema>;
