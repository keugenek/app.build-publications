import { z } from 'zod';

// Product categories enum
export const productCategorySchema = z.enum(['mice', 'keyboards', 'headsets']);
export type ProductCategory = z.infer<typeof productCategorySchema>;

// Article schema for peripheral reviews
export const articleSchema = z.object({
  id: z.number(),
  product_name: z.string(),
  category: productCategorySchema,
  price: z.number().positive(), // Price in dollars
  overall_rating: z.number().min(1).max(5), // 1-5 stars rating
  short_description: z.string(),
  detailed_review: z.string(), // Rich text/markdown content
  pros: z.array(z.string()), // Array of pro bullet points
  cons: z.array(z.string()), // Array of con bullet points
  main_image_url: z.string().url().nullable(), // Single main image URL, can be null
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Article = z.infer<typeof articleSchema>;

// Input schema for creating articles
export const createArticleInputSchema = z.object({
  product_name: z.string().min(1, "Product name is required"),
  category: productCategorySchema,
  price: z.number().positive("Price must be positive"),
  overall_rating: z.number().min(1, "Rating must be at least 1").max(5, "Rating cannot exceed 5"),
  short_description: z.string().min(1, "Short description is required"),
  detailed_review: z.string().min(1, "Detailed review is required"),
  pros: z.array(z.string()).min(1, "At least one pro is required"),
  cons: z.array(z.string()).min(1, "At least one con is required"),
  main_image_url: z.string().url().nullable() // Can be null if no image provided
});

export type CreateArticleInput = z.infer<typeof createArticleInputSchema>;

// Input schema for updating articles
export const updateArticleInputSchema = z.object({
  id: z.number(),
  product_name: z.string().min(1).optional(),
  category: productCategorySchema.optional(),
  price: z.number().positive().optional(),
  overall_rating: z.number().min(1).max(5).optional(),
  short_description: z.string().min(1).optional(),
  detailed_review: z.string().min(1).optional(),
  pros: z.array(z.string()).optional(),
  cons: z.array(z.string()).optional(),
  main_image_url: z.string().url().nullable().optional() // Can be null or undefined
});

export type UpdateArticleInput = z.infer<typeof updateArticleInputSchema>;

// Schema for filtering articles by category
export const getArticlesByCategoryInputSchema = z.object({
  category: productCategorySchema
});

export type GetArticlesByCategoryInput = z.infer<typeof getArticlesByCategoryInputSchema>;

// Schema for getting single article by ID
export const getArticleByIdInputSchema = z.object({
  id: z.number()
});

export type GetArticleByIdInput = z.infer<typeof getArticleByIdInputSchema>;

// Schema for deleting article
export const deleteArticleInputSchema = z.object({
  id: z.number()
});

export type DeleteArticleInput = z.infer<typeof deleteArticleInputSchema>;
