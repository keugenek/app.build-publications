import { db } from '../db';
import { articlesTable } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import { type GetArticlesByCategoryInput, type Article } from '../schema';

export const getArticlesByCategory = async (input: GetArticlesByCategoryInput): Promise<Article[]> => {
  try {
    // Query articles filtered by category, ordered by creation date (newest first)
    const results = await db.select()
      .from(articlesTable)
      .where(eq(articlesTable.category, input.category))
      .orderBy(desc(articlesTable.created_at))
      .execute();

    // Convert numeric fields from strings to numbers before returning
    return results.map(article => ({
      ...article,
      price: parseFloat(article.price), // Convert numeric price back to number
      overall_rating: parseFloat(article.overall_rating) // Convert numeric rating back to number
    }));
  } catch (error) {
    console.error('Failed to fetch articles by category:', error);
    throw error;
  }
};
