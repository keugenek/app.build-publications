import { type CreateReviewInput, type Review } from '../schema';

import { db } from '../db';
import { reviewsTable } from '../db/schema';

/**
 * Create a new review record.
 * Inserts into the `reviews` table and returns the created review.
 */
export const createReview = async (input: CreateReviewInput): Promise<Review> => {
  try {
    const result = await db
      .insert(reviewsTable)
      .values({
        title: input.title,
        brand: input.brand,
        model: input.model,
        rating: input.rating,
        summary: input.summary,
        body: input.body,
        category_id: input.category_id,
      })
      .returning()
      .execute();

    const review = result[0];
    return {
      ...review,
      // Ensure created_at is a Date instance (drizzle returns Date for timestamp)
      created_at: new Date(review.created_at),
    } as Review;
  } catch (error) {
    console.error('Failed to create review:', error);
    throw error;
  }
};
