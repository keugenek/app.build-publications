import { type Review } from '../schema';
import { db } from '../db';
import { reviewsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

/**
 * Stub handler to delete a review by ID.
 * Real implementation should remove the record from `reviews` table.
 */
export const deleteReview = async (id: number): Promise<Review> => {
  try {
    const result = await db
      .delete(reviewsTable)
      .where(eq(reviewsTable.id, id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Review with id ${id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Delete review failed:', error);
    throw error;
  }
};

