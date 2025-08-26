import { z } from 'zod';

// Enum for product categories
export const categoryEnumSchema = z.enum(['Mice', 'Keyboards', 'Headsets', 'Gamepads']);
export type Category = z.infer<typeof categoryEnumSchema>;

// Review article output schema (represents data stored in DB)
export const reviewArticleSchema = z.object({
  id: z.number(),
  product_name: z.string(),
  category: categoryEnumSchema,
  brand: z.string(),
  overall_rating: z.number().int().min(1).max(5),
  pros: z.array(z.string()),
  cons: z.array(z.string()),
  detailed_review: z.string(),
  featured_image: z.string(), // URL or path to image
  created_at: z.coerce.date()
});
export type ReviewArticle = z.infer<typeof reviewArticleSchema>;

// Input schema for creating a review article
export const createReviewInputSchema = z.object({
  product_name: z.string(),
  category: categoryEnumSchema,
  brand: z.string(),
  overall_rating: z.number().int().min(1).max(5),
  pros: z.array(z.string()),
  cons: z.array(z.string()),
  detailed_review: z.string(),
  featured_image: z.string() // In a real app this would be an upload handler
});
export type CreateReviewInput = z.infer<typeof createReviewInputSchema>;

// Input schema for updating a review article (all fields optional except id)
export const updateReviewInputSchema = z.object({
  id: z.number(),
  product_name: z.string().optional(),
  category: categoryEnumSchema.optional(),
  brand: z.string().optional(),
  overall_rating: z.number().int().min(1).max(5).optional(),
  pros: z.array(z.string()).optional(),
  cons: z.array(z.string()).optional(),
  detailed_review: z.string().optional(),
  featured_image: z.string().optional()
});
export type UpdateReviewInput = z.infer<typeof updateReviewInputSchema>;
