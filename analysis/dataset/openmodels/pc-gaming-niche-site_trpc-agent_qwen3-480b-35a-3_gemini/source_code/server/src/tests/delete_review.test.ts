import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { reviewsTable, categoriesTable } from '../db/schema';
import { deleteReview } from '../handlers/delete_review';
import { eq } from 'drizzle-orm';

describe('deleteReview', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create a category first as reviews need a category
    await db.insert(categoriesTable).values({ name: 'Test Category' }).execute();
  });
  
  afterEach(resetDB);

  it('should delete an existing review', async () => {
    // Create a review first
    const reviewResult = await db.insert(reviewsTable)
      .values({
        title: 'Test Review',
        content: 'This is a test review',
        categoryId: 1,
        published: true
      })
      .returning()
      .execute();
      
    const review = reviewResult[0];

    // Delete the review
    const result = await deleteReview(review.id);

    // Check that deletion was successful
    expect(result).toBe(true);

    // Verify review no longer exists in database
    const reviews = await db.select()
      .from(reviewsTable)
      .where(eq(reviewsTable.id, review.id))
      .execute();

    expect(reviews).toHaveLength(0);
  });

  it('should return false when trying to delete a non-existent review', async () => {
    // Try to delete a review that doesn't exist
    const result = await deleteReview(99999);

    // Check that deletion was not successful
    expect(result).toBe(false);
  });
});
