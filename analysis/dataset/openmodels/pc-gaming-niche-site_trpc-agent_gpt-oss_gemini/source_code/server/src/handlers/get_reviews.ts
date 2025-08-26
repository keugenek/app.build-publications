import { db } from '../db';
import { reviewsTable } from '../db/schema';
import { type Review } from '../schema';

/**
 * Stub handler to fetch all reviews.
 * Real implementation should query the `reviews` table.
 */
export const getReviews = async (): Promise<Review[]> => {
  const result = await db.select().from(reviewsTable).execute();
  return result;
};
