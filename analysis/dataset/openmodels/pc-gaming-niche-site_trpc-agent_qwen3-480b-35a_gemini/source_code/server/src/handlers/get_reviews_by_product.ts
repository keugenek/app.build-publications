import { db } from '../db';
import { reviewsTable } from '../db/schema';
import { type Review } from '../schema';
import { eq } from 'drizzle-orm';

export const getReviewsByProduct = async (productId: number): Promise<Review[]> => {
  try {
    // Fetch all reviews for the specified product
    const results = await db.select()
      .from(reviewsTable)
      .where(eq(reviewsTable.product_id, productId))
      .execute();

    // Convert numeric fields back to numbers before returning
    return results.map(review => ({
      ...review,
      rating: review.rating // Integer field - no conversion needed
    }));
  } catch (error) {
    console.error('Failed to fetch reviews for product:', error);
    throw error;
  }
};
