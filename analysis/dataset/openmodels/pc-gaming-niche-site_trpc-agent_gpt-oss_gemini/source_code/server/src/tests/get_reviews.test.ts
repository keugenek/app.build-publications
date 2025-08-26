import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { categoriesTable, reviewsTable } from '../db/schema';
import { type Review, type CreateReviewInput } from '../schema';
import { getReviews } from '../handlers/get_reviews';
import { eq } from 'drizzle-orm';

const testReviewInput: CreateReviewInput = {
  title: 'Great Phone',
  brand: 'TechBrand',
  model: 'X100',
  rating: 5,
  summary: 'Excellent device',
  body: 'I love the performance and battery life.',
  category_id: 0 // placeholder, will set after inserting category
};

describe('getReviews handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no reviews exist', async () => {
    const reviews = await getReviews();
    expect(Array.isArray(reviews)).toBe(true);
    expect(reviews).toHaveLength(0);
  });

  it('should return inserted reviews', async () => {
    // Insert a category first
    const [category] = await db
      .insert(categoriesTable)
      .values({ name: 'Smartphones' })
      .returning()
      .execute();

    // Insert a review linked to the category
    const reviewInput = { ...testReviewInput, category_id: category.id };
    const [inserted] = await db
      .insert(reviewsTable)
      .values({
        title: reviewInput.title,
        brand: reviewInput.brand,
        model: reviewInput.model,
        rating: reviewInput.rating,
        summary: reviewInput.summary,
        body: reviewInput.body,
        category_id: reviewInput.category_id
      })
      .returning()
      .execute();

    const reviews = await getReviews();
    expect(reviews).toHaveLength(1);
    const rev = reviews[0] as Review;
    expect(rev.id).toBe(inserted.id);
    expect(rev.title).toBe(reviewInput.title);
    expect(rev.brand).toBe(reviewInput.brand);
    expect(rev.model).toBe(reviewInput.model);
    expect(rev.rating).toBe(reviewInput.rating);
    expect(rev.summary).toBe(reviewInput.summary);
    expect(rev.body).toBe(reviewInput.body);
    expect(rev.category_id).toBe(reviewInput.category_id);
    expect(rev.created_at).toBeInstanceOf(Date);
  });
});
