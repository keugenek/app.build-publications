import { db } from '../db';
import { articlesTable } from '../db/schema';
import { desc } from 'drizzle-orm';
import { type Article } from '../schema';

export const getArticles = async (): Promise<Article[]> => {
  try {
    // Query all articles ordered by creation date (newest first)
    const results = await db.select()
      .from(articlesTable)
      .orderBy(desc(articlesTable.created_at))
      .execute();

    // Convert numeric fields back to numbers and ensure proper type mapping
    return results.map(article => ({
      ...article,
      price: parseFloat(article.price), // Convert numeric field from string to number
      overall_rating: parseFloat(article.overall_rating) // Convert numeric field from string to number
    }));
  } catch (error) {
    console.error('Failed to fetch articles:', error);
    throw error;
  }
};
