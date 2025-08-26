import { db } from '../db';
import { articlesTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type GetArticleByIdInput, type Article } from '../schema';

export const getArticleById = async (input: GetArticleByIdInput): Promise<Article | null> => {
  try {
    const results = await db.select()
      .from(articlesTable)
      .where(eq(articlesTable.id, input.id))
      .execute();

    if (results.length === 0) {
      return null;
    }

    const article = results[0];
    
    // Convert numeric fields back to numbers for schema compliance
    return {
      ...article,
      price: parseFloat(article.price),
      overall_rating: parseFloat(article.overall_rating)
    };
  } catch (error) {
    console.error('Failed to get article by id:', error);
    throw error;
  }
};
