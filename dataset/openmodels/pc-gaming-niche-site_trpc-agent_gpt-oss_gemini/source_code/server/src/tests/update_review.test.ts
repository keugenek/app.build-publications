import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable, reviewsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type CreateReviewInput, type UpdateReviewInput } from '../schema';
import { updateReview } from '../handlers/update_review';

// Helper to insert a category
const insertCategory = async (name: string) => {
  const result = await db.insert(categoriesTable)
    .values({ name })
    .returning()
    .execute();
  return result[0];
};

// Helper to insert a review
const insertReview = async (input: CreateReviewInput, categoryId: number) => {
  const result = await db.insert(reviewsTable)
    .values({ ...input, category_id: categoryId })
    .returning()
    .execute();
  return result[0];
};

describe('updateReview', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update only provided fields and keep others unchanged', async () => {
    const category = await insertCategory('Electronics');
    const reviewInput: CreateReviewInput = {
      title: 'Original Title',
      brand: 'Original Brand',
      model: 'Original Model',
      rating: 4,
      summary: 'Original summary',
      body: 'Original body',
      category_id: category.id,
    };
    const review = await insertReview(reviewInput, category.id);

    const updateInput: UpdateReviewInput = {
      id: review.id,
      title: 'Updated Title',
      rating: 5,
    };

    const updated = await updateReview(updateInput);

    // Verify updated fields
    expect(updated.title).toBe('Updated Title');
    expect(updated.rating).toBe(5);
    // Verify unchanged fields remain the same
    expect(updated.brand).toBe(review.brand);
    expect(updated.model).toBe(review.model);
    expect(updated.summary).toBe(review.summary);
    expect(updated.body).toBe(review.body);
    expect(updated.category_id).toBe(review.category_id);
    // Ensure created_at is a Date instance
    expect(updated.created_at).toBeInstanceOf(Date);
  });

  it('should throw an error when review does not exist', async () => {
    const nonExistentId = 9999;
    const updateInput: UpdateReviewInput = { id: nonExistentId, title: 'Anything' };
    await expect(updateReview(updateInput)).rejects.toThrow(/not found/i);
  });
});
