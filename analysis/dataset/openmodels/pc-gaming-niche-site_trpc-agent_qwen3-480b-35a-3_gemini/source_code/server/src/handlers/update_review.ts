import { db } from '../db';
import { reviewsTable } from '../db/schema';
import { type UpdateReviewInput, type Review } from '../schema';
import { eq } from 'drizzle-orm';

export const updateReview = async (input: UpdateReviewInput): Promise<Review> => {
  try {
    // Prepare update data - only include fields that are provided
    const updateData: any = {
      updated_at: new Date()
    };
    
    if (input.title !== undefined) {
      updateData.title = input.title;
    }
    
    if (input.content !== undefined) {
      updateData.content = input.content;
    }
    
    if (input.category_id !== undefined) {
      updateData.categoryId = input.category_id;
    }
    
    if (input.published !== undefined) {
      updateData.published = input.published;
    }

    // Update review record
    const result = await db.update(reviewsTable)
      .set(updateData)
      .where(eq(reviewsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Review with id ${input.id} not found`);
    }

    // Return the updated review
    const review = result[0];
    return {
      ...review,
      category_id: review.categoryId, // Map categoryId to category_id for the schema
      created_at: new Date(review.created_at),
      updated_at: new Date(review.updated_at)
    };
  } catch (error) {
    console.error('Review update failed:', error);
    throw error;
  }
};
