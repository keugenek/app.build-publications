import { db } from '../db';
import { articlesTable } from '../db/schema';
import { type CreateArticleInput, type Article } from '../schema';

export const createArticle = async (input: CreateArticleInput): Promise<Article> => {
  try {
    // Insert article record
    const result = await db.insert(articlesTable)
      .values({
        title: input.title,
        slug: input.slug,
        content: input.content,
        excerpt: input.excerpt,
        image_url: input.image_url,
        published: input.published
      })
      .returning()
      .execute();

    const article = result[0];
    return {
      ...article,
      created_at: new Date(article.created_at),
      updated_at: new Date(article.updated_at)
    };
  } catch (error) {
    console.error('Article creation failed:', error);
    throw error;
  }
};
