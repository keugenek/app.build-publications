import { db } from '../db';
import { reviewArticlesTable } from '../db/schema';
import { type GetReviewBySlugInput, type ReviewArticle } from '../schema';
import { eq } from 'drizzle-orm';

export async function getReviewBySlug(input: GetReviewBySlugInput): Promise<ReviewArticle | null> {
  try {
    const results = await db.select()
      .from(reviewArticlesTable)
      .where(eq(reviewArticlesTable.slug, input.slug))
      .limit(1)
      .execute();

    if (results.length === 0) {
      return null;
    }

    const article = results[0];
    return {
      ...article,
      // Ensure pros and cons are properly typed as string arrays
      pros: Array.isArray(article.pros) ? article.pros : [],
      cons: Array.isArray(article.cons) ? article.cons : []
    };
  } catch (error) {
    console.error('Failed to fetch review by slug:', error);
    throw error;
  }
}
