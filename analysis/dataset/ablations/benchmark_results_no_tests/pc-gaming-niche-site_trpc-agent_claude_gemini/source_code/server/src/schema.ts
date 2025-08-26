import { z } from 'zod';

// Product categories enum
export const productCategorySchema = z.enum(['mice', 'keyboards', 'headsets', 'mousepads', 'controllers']);
export type ProductCategory = z.infer<typeof productCategorySchema>;

// Product review schema with proper numeric handling
export const productReviewSchema = z.object({
  id: z.number(),
  product_name: z.string(),
  brand: z.string(),
  category: productCategorySchema,
  rating: z.number().min(1).max(10), // Rating from 1-10
  pros: z.array(z.string()), // Array of pros as strings
  cons: z.array(z.string()), // Array of cons as strings
  review_text: z.string(),
  image_urls: z.array(z.string()), // Array of image URLs for gallery
  is_published: z.boolean(),
  created_at: z.coerce.date(), // Automatically converts string timestamps to Date objects
  updated_at: z.coerce.date().nullable() // Can be null if never updated
});

export type ProductReview = z.infer<typeof productReviewSchema>;

// Input schema for creating product reviews
export const createProductReviewInputSchema = z.object({
  product_name: z.string().min(1, 'Product name is required'),
  brand: z.string().min(1, 'Brand is required'),
  category: productCategorySchema,
  rating: z.number().min(1, 'Rating must be at least 1').max(10, 'Rating must be at most 10'),
  pros: z.array(z.string().min(1, 'Each pro must be a non-empty string')),
  cons: z.array(z.string().min(1, 'Each con must be a non-empty string')),
  review_text: z.string().min(10, 'Review text must be at least 10 characters'),
  image_urls: z.array(z.string().url('Each image URL must be valid')).optional().default([]),
  is_published: z.boolean().optional().default(false)
});

export type CreateProductReviewInput = z.infer<typeof createProductReviewInputSchema>;

// Input schema for updating product reviews
export const updateProductReviewInputSchema = z.object({
  id: z.number(),
  product_name: z.string().min(1, 'Product name is required').optional(),
  brand: z.string().min(1, 'Brand is required').optional(),
  category: productCategorySchema.optional(),
  rating: z.number().min(1, 'Rating must be at least 1').max(10, 'Rating must be at most 10').optional(),
  pros: z.array(z.string().min(1, 'Each pro must be a non-empty string')).optional(),
  cons: z.array(z.string().min(1, 'Each con must be a non-empty string')).optional(),
  review_text: z.string().min(10, 'Review text must be at least 10 characters').optional(),
  image_urls: z.array(z.string().url('Each image URL must be valid')).optional(),
  is_published: z.boolean().optional()
});

export type UpdateProductReviewInput = z.infer<typeof updateProductReviewInputSchema>;

// Query schema for filtering reviews
export const getReviewsQuerySchema = z.object({
  category: productCategorySchema.optional(),
  is_published: z.boolean().optional(),
  brand: z.string().optional(),
  limit: z.number().int().positive().max(100).optional().default(20),
  offset: z.number().int().nonnegative().optional().default(0)
});

export type GetReviewsQuery = z.infer<typeof getReviewsQuerySchema>;

// Schema for getting a single review by ID
export const getReviewByIdSchema = z.object({
  id: z.number()
});

export type GetReviewByIdInput = z.infer<typeof getReviewByIdSchema>;

// Schema for deleting a review
export const deleteReviewInputSchema = z.object({
  id: z.number()
});

export type DeleteReviewInput = z.infer<typeof deleteReviewInputSchema>;
