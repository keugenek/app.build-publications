import { db } from '../db';
import { reviewArticlesTable, categoriesTable } from '../db/schema';
import { type UpdateReviewArticleInput, type ReviewArticle } from '../schema';
import { eq, SQL, and } from 'drizzle-orm';

export const updateReviewArticle = async (input: UpdateReviewArticleInput): Promise<ReviewArticle> => {
  try {
    // First, verify the review article exists
    const existingArticle = await db.select()
      .from(reviewArticlesTable)
      .where(eq(reviewArticlesTable.id, input.id))
      .execute();

    if (existingArticle.length === 0) {
      throw new Error(`Review article with id ${input.id} not found`);
    }

    // If category_id is being updated, verify the category exists
    if (input.category_id !== undefined) {
      const categoryExists = await db.select()
        .from(categoriesTable)
        .where(eq(categoriesTable.id, input.category_id))
        .execute();

      if (categoryExists.length === 0) {
        throw new Error(`Category with id ${input.category_id} not found`);
      }
    }

    // Build update object with only provided fields
    const updateData: any = {
      updated_at: new Date()
    };

    if (input.title !== undefined) {
      updateData.title = input.title;
    }
    if (input.category_id !== undefined) {
      updateData.category_id = input.category_id;
    }
    if (input.brand !== undefined) {
      updateData.brand = input.brand;
    }
    if (input.model !== undefined) {
      updateData.model = input.model;
    }
    if (input.star_rating !== undefined) {
      updateData.star_rating = input.star_rating.toString(); // Convert number to string for numeric column
    }
    if (input.pros !== undefined) {
      updateData.pros = input.pros;
    }
    if (input.cons !== undefined) {
      updateData.cons = input.cons;
    }
    if (input.main_image_url !== undefined) {
      updateData.main_image_url = input.main_image_url;
    }
    if (input.review_content !== undefined) {
      updateData.review_content = input.review_content;
    }
    if (input.published_at !== undefined) {
      updateData.published_at = input.published_at;
    }

    // Update the review article
    const result = await db.update(reviewArticlesTable)
      .set(updateData)
      .where(eq(reviewArticlesTable.id, input.id))
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const updatedArticle = result[0];
    return {
      ...updatedArticle,
      star_rating: parseFloat(updatedArticle.star_rating) // Convert string back to number
    };
  } catch (error) {
    console.error('Review article update failed:', error);
    throw error;
  }
};
