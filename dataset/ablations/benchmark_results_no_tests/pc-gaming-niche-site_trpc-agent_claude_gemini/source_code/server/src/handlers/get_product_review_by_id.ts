import { db } from '../db';
import { productReviewsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type GetReviewByIdInput, type ProductReview } from '../schema';

export const getProductReviewById = async (input: GetReviewByIdInput): Promise<ProductReview | null> => {
  try {
    // Query for the specific review by ID
    const result = await db.select()
      .from(productReviewsTable)
      .where(eq(productReviewsTable.id, input.id))
      .limit(1)
      .execute();

    // Return null if no review found
    if (result.length === 0) {
      return null;
    }

    // Return the review (rating is already a number with real type)
    const review = result[0];
    return review;
  } catch (error) {
    console.error('Failed to fetch product review by ID:', error);
    throw error;
  }
};
