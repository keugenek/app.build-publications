import { z } from 'zod';

// Category schema
export const categorySchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  created_at: z.coerce.date()
});

export type Category = z.infer<typeof categorySchema>;

// Input schema for creating categories
export const createCategoryInputSchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  description: z.string().nullable()
});

export type CreateCategoryInput = z.infer<typeof createCategoryInputSchema>;

// Input schema for updating categories
export const updateCategoryInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1, 'Category name is required').optional(),
  description: z.string().nullable().optional()
});

export type UpdateCategoryInput = z.infer<typeof updateCategoryInputSchema>;

// Review article schema
export const reviewArticleSchema = z.object({
  id: z.number(),
  title: z.string(),
  category_id: z.number(),
  brand: z.string(),
  model: z.string(),
  star_rating: z.number(),
  pros: z.string(),
  cons: z.string(),
  main_image_url: z.string().nullable(),
  review_content: z.string(),
  published_at: z.coerce.date(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type ReviewArticle = z.infer<typeof reviewArticleSchema>;

// Input schema for creating review articles
export const createReviewArticleInputSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  category_id: z.number(),
  brand: z.string().min(1, 'Brand is required'),
  model: z.string().min(1, 'Model is required'),
  star_rating: z.number().min(1, 'Minimum rating is 1').max(5, 'Maximum rating is 5'),
  pros: z.string().min(1, 'Pros section is required'),
  cons: z.string().min(1, 'Cons section is required'),
  main_image_url: z.string().nullable(),
  review_content: z.string().min(1, 'Review content is required'),
  published_at: z.coerce.date().optional() // Defaults to now if not provided
});

export type CreateReviewArticleInput = z.infer<typeof createReviewArticleInputSchema>;

// Input schema for updating review articles
export const updateReviewArticleInputSchema = z.object({
  id: z.number(),
  title: z.string().min(1, 'Title is required').optional(),
  category_id: z.number().optional(),
  brand: z.string().min(1, 'Brand is required').optional(),
  model: z.string().min(1, 'Model is required').optional(),
  star_rating: z.number().min(1, 'Minimum rating is 1').max(5, 'Maximum rating is 5').optional(),
  pros: z.string().min(1, 'Pros section is required').optional(),
  cons: z.string().min(1, 'Cons section is required').optional(),
  main_image_url: z.string().nullable().optional(),
  review_content: z.string().min(1, 'Review content is required').optional(),
  published_at: z.coerce.date().optional()
});

export type UpdateReviewArticleInput = z.infer<typeof updateReviewArticleInputSchema>;

// Schema for review article with category information (for joined queries)
export const reviewArticleWithCategorySchema = z.object({
  id: z.number(),
  title: z.string(),
  category_id: z.number(),
  brand: z.string(),
  model: z.string(),
  star_rating: z.number(),
  pros: z.string(),
  cons: z.string(),
  main_image_url: z.string().nullable(),
  review_content: z.string(),
  published_at: z.coerce.date(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
  category: z.object({
    name: z.string(),
    description: z.string().nullable()
  })
});

export type ReviewArticleWithCategory = z.infer<typeof reviewArticleWithCategorySchema>;

// Query parameter schemas
export const getCategoriesQuerySchema = z.object({});

export type GetCategoriesQuery = z.infer<typeof getCategoriesQuerySchema>;

export const getReviewArticlesQuerySchema = z.object({
  category_id: z.number().optional(),
  limit: z.number().int().positive().max(100).default(20).optional(),
  offset: z.number().int().nonnegative().default(0).optional()
});

export type GetReviewArticlesQuery = z.infer<typeof getReviewArticlesQuerySchema>;

export const getReviewArticleByIdQuerySchema = z.object({
  id: z.number()
});

export type GetReviewArticleByIdQuery = z.infer<typeof getReviewArticleByIdQuerySchema>;

export const deleteCategoryInputSchema = z.object({
  id: z.number()
});

export type DeleteCategoryInput = z.infer<typeof deleteCategoryInputSchema>;

export const deleteReviewArticleInputSchema = z.object({
  id: z.number()
});

export type DeleteReviewArticleInput = z.infer<typeof deleteReviewArticleInputSchema>;
