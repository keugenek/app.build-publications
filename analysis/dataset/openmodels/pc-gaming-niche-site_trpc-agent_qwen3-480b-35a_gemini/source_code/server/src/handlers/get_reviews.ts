import { db } from '../db';
import { reviewsTable } from '../db/schema';
import { type Review } from '../schema';

export const getReviews = async (): Promise<Review[]> => {
  try {
    const results = await db.select()
      .from(reviewsTable)
      .execute();

    // Convert numeric fields back to numbers before returning
    return results.map(review => ({
      ...review,
      rating: review.rating // Integer column - no conversion needed
    }));
  } catch (error) {
    console.error('Failed to fetch reviews:', error);
    throw error;
  }
};
