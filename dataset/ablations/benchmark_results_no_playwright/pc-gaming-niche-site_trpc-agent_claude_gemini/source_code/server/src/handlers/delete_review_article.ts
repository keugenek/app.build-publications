import { db } from '../db';
import { reviewArticlesTable } from '../db/schema';
import { type DeleteReviewArticleInput } from '../schema';
import { eq } from 'drizzle-orm';

export async function deleteReviewArticle(input: DeleteReviewArticleInput): Promise<{ success: boolean }> {
  try {
    // Check if the review article exists before attempting deletion
    const existingArticle = await db.select()
      .from(reviewArticlesTable)
      .where(eq(reviewArticlesTable.id, input.id))
      .execute();

    if (existingArticle.length === 0) {
      throw new Error(`Review article with id ${input.id} not found`);
    }

    // Delete the review article
    const result = await db.delete(reviewArticlesTable)
      .where(eq(reviewArticlesTable.id, input.id))
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Review article deletion failed:', error);
    throw error;
  }
}
