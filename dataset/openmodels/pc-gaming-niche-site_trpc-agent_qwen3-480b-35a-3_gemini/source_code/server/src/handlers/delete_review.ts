import { db } from '../db';
import { reviewsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const deleteReview = async (id: number): Promise<boolean> => {
  try {
    const result = await db.delete(reviewsTable)
      .where(eq(reviewsTable.id, id))
      .returning({ id: reviewsTable.id })
      .execute();

    // Return true if a review was deleted, false otherwise
    return result.length > 0;
  } catch (error) {
    console.error('Review deletion failed:', error);
    throw error;
  }
};
