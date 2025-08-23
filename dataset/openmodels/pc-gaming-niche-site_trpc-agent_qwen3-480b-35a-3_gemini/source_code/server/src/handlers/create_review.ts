import { db } from '../db';
import { reviewsTable, categoriesTable } from '../db/schema';
import { type CreateReviewInput, type Review } from '../schema';
import { eq } from 'drizzle-orm';

export const createReview = async (input: CreateReviewInput): Promise<Review> => {
  try {
    // First, verify that the category exists
    const categoryExists = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, input.category_id))
      .execute();

    if (categoryExists.length === 0) {
      throw new Error(`Category with id ${input.category_id} not found`);
    }

    // Insert review record
    const result = await db.insert(reviewsTable)
      .values({
        title: input.title,
        content: input.content,
        categoryId: input.category_id,
        published: input.published
      })
      .returning()
      .execute();

    // Return the created review
    const review = result[0];
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
    console.error('Review creation failed:', error);
    throw error;
  }
};
