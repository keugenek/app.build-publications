import { db } from '../db';
import { articlesTable } from '../db/schema';
import { type DeleteArticleInput } from '../schema';
import { eq } from 'drizzle-orm';

export const deleteArticle = async (input: DeleteArticleInput): Promise<boolean> => {
  try {
    // Delete the article by ID
    const result = await db.delete(articlesTable)
      .where(eq(articlesTable.id, input.id))
      .execute();

    // Check if any rows were affected (article existed and was deleted)
    return result.rowCount !== null && result.rowCount > 0;
  } catch (error) {
    console.error('Article deletion failed:', error);
    throw error;
  }
};
