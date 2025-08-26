import { db } from '../db';
import { reviewsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type Review } from '../schema';

export const getReviews = async (): Promise<Review[]> => {
  try {
    const results = await db.select()
      .from(reviewsTable)
      .execute();

    // Convert database results to match the Zod schema
    return results.map(review => ({
      id: review.id,
      title: review.title,
      content: review.content,
      category_id: review.categoryId,
      published: review.published,
      created_at: review.created_at,
      updated_at: review.updated_at
    }));
  } catch (error) {
    console.error('Failed to fetch reviews:', error);
    throw error;
  }
};

export const getReviewById = async (id: number): Promise<Review | null> => {
  try {
    const results = await db.select()
      .from(reviewsTable)
      .where(eq(reviewsTable.id, id))
      .execute();

    if (results.length === 0) {
      return null;
    }

    const review = results[0];
    return {
      id: review.id,
      title: review.title,
      content: review.content,
      category_id: review.categoryId,
      published: review.published,
      created_at: review.created_at,
      updated_at: review.updated_at
    };
  } catch (error) {
    console.error('Failed to fetch review by ID:', error);
    throw error;
  }
};

export const getPublishedReviews = async (): Promise<Review[]> => {
  try {
    const results = await db.select()
      .from(reviewsTable)
      .where(eq(reviewsTable.published, true))
      .execute();

    // Convert database results to match the Zod schema
    return results.map(review => ({
      id: review.id,
      title: review.title,
      content: review.content,
      category_id: review.categoryId,
      published: review.published,
      created_at: review.created_at,
      updated_at: review.updated_at
    }));
  } catch (error) {
    console.error('Failed to fetch published reviews:', error);
    throw error;
  }
};
