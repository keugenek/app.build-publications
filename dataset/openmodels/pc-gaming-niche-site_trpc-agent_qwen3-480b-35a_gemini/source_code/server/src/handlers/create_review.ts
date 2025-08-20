import { db } from '../db';
import { reviewsTable } from '../db/schema';
import { type CreateReviewInput, type Review } from '../schema';

export const createReview = async (input: CreateReviewInput): Promise<Review> => {
  try {
    // Insert review record
    const result = await db.insert(reviewsTable)
      .values({
        product_id: input.product_id,
        title: input.title,
        content: input.content,
        rating: input.rating,
        pros: input.pros,
        cons: input.cons
      })
      .returning()
      .execute();

    // Return the created review
    const review = result[0];
    return {
      ...review,
      created_at: new Date(review.created_at),
      updated_at: new Date(review.updated_at)
    };
  } catch (error) {
    console.error('Review creation failed:', error);
    throw error;
  }
};
