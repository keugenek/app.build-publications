import { db } from '../db';
import { reviewArticles } from '../db/schema';
import { type CreateReviewInput, type ReviewArticle } from '../schema';

/**
 * Creates a new review article in the database.
 * Inserts the article and returns the created record.
 */
export async function createReview(input: CreateReviewInput): Promise<ReviewArticle> {
  try {
    // Insert review article record
    const result = await db
      .insert(reviewArticles)
      .values({
        product_name: input.product_name,
        category: input.category,
        brand: input.brand,
        overall_rating: input.overall_rating,
        pros: input.pros,
        cons: input.cons,
        detailed_review: input.detailed_review,
        featured_image: input.featured_image,
        // created_at will be set by DB default
      })
      .returning()
      .execute();

    // Drizzle returns created_at as Date already, no conversion needed
    const article = result[0];
    return article as ReviewArticle;
  } catch (error) {
    console.error('Review creation failed:', error);
    throw error;
  }
}
