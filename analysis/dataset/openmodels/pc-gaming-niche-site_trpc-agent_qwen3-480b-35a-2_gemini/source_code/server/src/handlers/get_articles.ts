import { db } from '../db';
import { articlesTable } from '../db/schema';
import { type Article } from '../schema';
import { eq } from 'drizzle-orm';

export const getArticles = async (): Promise<Article[]> => {
  try {
    const results = await db.select()
      .from(articlesTable)
      .execute();

    return results.map(article => ({
      ...article,
      created_at: article.created_at,
      updated_at: article.updated_at
    }));
  } catch (error) {
    console.error('Failed to fetch articles:', error);
    throw error;
  }
};

export const getPublishedArticles = async (): Promise<Article[]> => {
  try {
    const results = await db.select()
      .from(articlesTable)
      .where(eq(articlesTable.published, true))
      .execute();

    return results.map(article => ({
      ...article,
      created_at: article.created_at,
      updated_at: article.updated_at
    }));
  } catch (error) {
    console.error('Failed to fetch published articles:', error);
    throw error;
  }
};

export const getArticleBySlug = async (slug: string): Promise<Article | null> => {
  try {
    const results = await db.select()
      .from(articlesTable)
      .where(eq(articlesTable.slug, slug))
      .execute();

    if (results.length === 0) {
      return null;
    }

    const article = results[0];
    return {
      ...article,
      created_at: article.created_at,
      updated_at: article.updated_at
    };
  } catch (error) {
    console.error(`Failed to fetch article with slug ${slug}:`, error);
    throw error;
  }
};
