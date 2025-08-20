import { db } from '../db';
import { reviewArticlesTable, categoriesTable } from '../db/schema';
import { type CreateReviewArticleInput, type ReviewArticle } from '../schema';
import { eq } from 'drizzle-orm';

export async function createReviewArticle(input: CreateReviewArticleInput): Promise<ReviewArticle> {
  try {
    // Validate that the category exists before creating the review article
    const categoryExists = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, input.category_id))
      .execute();

    if (categoryExists.length === 0) {
      throw new Error(`Category with id ${input.category_id} does not exist`);
    }

    const now = new Date();
    const publishedAt = input.published_at || now;

    // Insert the review article
    const result = await db.insert(reviewArticlesTable)
      .values({
        title: input.title,
        category_id: input.category_id,
        brand: input.brand,
        model: input.model,
        star_rating: input.star_rating.toString(), // Convert number to string for numeric column
        pros: input.pros,
        cons: input.cons,
        main_image_url: input.main_image_url,
        review_content: input.review_content,
        published_at: publishedAt,
        created_at: now,
        updated_at: now
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const reviewArticle = result[0];
    return {
      ...reviewArticle,
      star_rating: parseFloat(reviewArticle.star_rating) // Convert string back to number
    };
  } catch (error) {
    console.error('Review article creation failed:', error);
    throw error;
  }
}
