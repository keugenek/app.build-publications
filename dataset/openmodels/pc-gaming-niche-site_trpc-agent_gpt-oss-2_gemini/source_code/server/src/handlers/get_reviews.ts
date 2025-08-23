import { db } from '../db';
import { reviewArticles } from '../db/schema';
import { type ReviewArticle } from '../schema';

/**
 * Fetch all review articles from the database.
 * Returns an empty array if none exist.
 */
export async function getReviews(): Promise<ReviewArticle[]> {
  try {
    const rows = await db.select().from(reviewArticles).execute();
    // Convert JSONB fields (pros, cons) to string arrays for type safety
    return rows.map(row => ({
      ...row,
      pros: (row as any).pros as string[],
      cons: (row as any).cons as string[]
    }));
  } catch (error) {
    console.error('Failed to fetch review articles:', error);
    throw error;
  }
}
