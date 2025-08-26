import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { categoriesTable, reviewsTable } from '../db/schema';
import { deleteReview } from '../handlers/delete_review';
import { eq } from 'drizzle-orm';

describe('deleteReview', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing review and return it', async () => {
    // Create a category first (foreign key)
    const [category] = await db
      .insert(categoriesTable)
      .values({ name: 'Tech' })
      .returning()
      .execute();

    // Insert a review linked to the category
    const [review] = await db
      .insert(reviewsTable)
      .values({
        title: 'Great Product',
        brand: 'BrandX',
        model: 'ModelY',
        rating: 5,
        summary: 'Excellent',
        body: 'Detailed review body',
        category_id: category.id,
      })
      .returning()
      .execute();

    // Delete the review using the handler
    const deleted = await deleteReview(review.id);

    // Verify returned data matches inserted review (except created_at which may differ slightly)
    expect(deleted.id).toBe(review.id);
    expect(deleted.title).toBe(review.title);
    expect(deleted.brand).toBe(review.brand);
    expect(deleted.model).toBe(review.model);
    expect(deleted.rating).toBe(review.rating);
    expect(deleted.summary).toBe(review.summary);
    expect(deleted.body).toBe(review.body);
    expect(deleted.category_id).toBe(review.category_id);
    expect(deleted.created_at).toBeInstanceOf(Date);

    // Ensure the review no longer exists in the database
    const remaining = await db
      .select()
      .from(reviewsTable)
      .where(eq(reviewsTable.id, review.id))
      .execute();
    expect(remaining).toHaveLength(0);
  });

  it('should throw an error when trying to delete a non‑existent review', async () => {
    await expect(deleteReview(9999)).rejects.toThrow(/not found/i);
  });
});
