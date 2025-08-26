import { db } from '../db';
import { reviewArticlesTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export async function deleteReviewArticle(id: number): Promise<boolean> {
  try {
    // Delete the review article by ID
    const result = await db
      .delete(reviewArticlesTable)
      .where(eq(reviewArticlesTable.id, id))
      .execute();

    // Check if any rows were affected (deleted)
    // result.rowCount will be 1 if a record was deleted, 0 if no record found
    return (result.rowCount ?? 0) > 0;
  } catch (error) {
    console.error('Review article deletion failed:', error);
    throw error;
  }
}
