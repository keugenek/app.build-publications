import { db } from '../db';
import { productReviewsTable } from '../db/schema';
import { type GetReviewsQuery, type ProductReview } from '../schema';
import { eq, desc, and, type SQL } from 'drizzle-orm';

export const getProductReviews = async (query: GetReviewsQuery): Promise<ProductReview[]> => {
  try {
    // Build conditions array for filtering
    const conditions: SQL<unknown>[] = [];

    if (query.category !== undefined) {
      conditions.push(eq(productReviewsTable.category, query.category));
    }

    if (query.is_published !== undefined) {
      conditions.push(eq(productReviewsTable.is_published, query.is_published));
    }

    if (query.brand !== undefined) {
      conditions.push(eq(productReviewsTable.brand, query.brand));
    }

    // Build query with or without where clause
    const baseQuery = db.select().from(productReviewsTable);
    
    const finalQuery = conditions.length > 0 
      ? baseQuery.where(conditions.length === 1 ? conditions[0] : and(...conditions))
      : baseQuery;

    // Execute query with ordering and pagination
    const results = await finalQuery
      .orderBy(desc(productReviewsTable.created_at))
      .limit(query.limit)
      .offset(query.offset)
      .execute();

    // Convert numeric rating field back to number and ensure proper type conversion
    return results.map(result => ({
      ...result,
      rating: typeof result.rating === 'string' ? parseFloat(result.rating) : result.rating,
    }));
  } catch (error) {
    console.error('Failed to fetch product reviews:', error);
    throw error;
  }
};
