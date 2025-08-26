import { z } from 'zod';

// Product category enum
export const productCategorySchema = z.enum(['mice', 'keyboards', 'headsets']);
export type ProductCategory = z.infer<typeof productCategorySchema>;

// Price range enum
export const priceRangeSchema = z.enum(['under_25', '25_50', '50_100', '100_plus']);
export type PriceRange = z.infer<typeof priceRangeSchema>;

// Review article schema
export const reviewArticleSchema = z.object({
  id: z.number(),
  product_name: z.string(),
  brand: z.string(),
  category: productCategorySchema,
  star_rating: z.number().int().min(1).max(5),
  price_range: priceRangeSchema,
  pros: z.array(z.string()), // Array of pros stored as JSON
  cons: z.array(z.string()), // Array of cons stored as JSON
  review_body: z.string(), // Detailed review content
  slug: z.string(), // URL-friendly identifier
  published: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type ReviewArticle = z.infer<typeof reviewArticleSchema>;

// Input schema for creating review articles
export const createReviewArticleInputSchema = z.object({
  product_name: z.string().min(1, "Product name is required"),
  brand: z.string().min(1, "Brand is required"),
  category: productCategorySchema,
  star_rating: z.number().int().min(1).max(5),
  price_range: priceRangeSchema,
  pros: z.array(z.string().min(1)).min(1, "At least one pro is required"),
  cons: z.array(z.string().min(1)).min(1, "At least one con is required"),
  review_body: z.string().min(50, "Review body must be at least 50 characters"),
  published: z.boolean().default(false)
});

export type CreateReviewArticleInput = z.infer<typeof createReviewArticleInputSchema>;

// Input schema for updating review articles
export const updateReviewArticleInputSchema = z.object({
  id: z.number(),
  product_name: z.string().min(1).optional(),
  brand: z.string().min(1).optional(),
  category: productCategorySchema.optional(),
  star_rating: z.number().int().min(1).max(5).optional(),
  price_range: priceRangeSchema.optional(),
  pros: z.array(z.string().min(1)).min(1).optional(),
  cons: z.array(z.string().min(1)).min(1).optional(),
  review_body: z.string().min(50).optional(),
  published: z.boolean().optional()
});

export type UpdateReviewArticleInput = z.infer<typeof updateReviewArticleInputSchema>;

// Query schema for filtering reviews
export const reviewQuerySchema = z.object({
  category: productCategorySchema.optional(),
  brand: z.string().optional(),
  price_range: priceRangeSchema.optional(),
  published: z.boolean().optional(),
  limit: z.number().int().positive().max(100).default(20),
  offset: z.number().int().nonnegative().default(0)
});

export type ReviewQuery = z.infer<typeof reviewQuerySchema>;

// Schema for getting a single review by slug
export const getReviewBySlugInputSchema = z.object({
  slug: z.string()
});

export type GetReviewBySlugInput = z.infer<typeof getReviewBySlugInputSchema>;
