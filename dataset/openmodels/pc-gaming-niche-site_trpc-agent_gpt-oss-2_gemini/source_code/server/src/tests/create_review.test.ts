import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { reviewArticles } from '../db/schema';
import { type CreateReviewInput, type ReviewArticle } from '../schema';
import { createReview } from '../handlers/create_review';
import { eq } from 'drizzle-orm';

// Sample input for creating a review
const testInput: CreateReviewInput = {
  product_name: 'Gaming Mouse X1',
  category: 'Mice',
  brand: 'BrandA',
  overall_rating: 4,
  pros: ['Ergonomic', 'High DPI'],
  cons: ['Expensive'],
  detailed_review: 'A great mouse for esports.',
  featured_image: 'http://example.com/mouse.jpg'
};

describe('createReview handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should insert a review and return proper fields', async () => {
    const result = await createReview(testInput);

    // Verify returned object fields
    expect(result.id).toBeDefined();
    expect(result.product_name).toBe(testInput.product_name);
    expect(result.category).toBe(testInput.category);
    expect(result.brand).toBe(testInput.brand);
    expect(result.overall_rating).toBe(testInput.overall_rating);
    expect(result.pros).toEqual(testInput.pros);
    expect(result.cons).toEqual(testInput.cons);
    expect(result.detailed_review).toBe(testInput.detailed_review);
    expect(result.featured_image).toBe(testInput.featured_image);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should persist the review in the database', async () => {
    const created = await createReview(testInput);

    const rows = await db.select().from(reviewArticles).where(eq(reviewArticles.id, created.id)).execute();
    expect(rows).toHaveLength(1);
    const stored = rows[0];
    // Ensure stored data matches input
    expect(stored.product_name).toBe(testInput.product_name);
    expect(stored.category).toBe(testInput.category);
    expect(stored.brand).toBe(testInput.brand);
    expect(stored.overall_rating).toBe(testInput.overall_rating);
    expect(stored.pros).toEqual(testInput.pros);
    expect(stored.cons).toEqual(testInput.cons);
    expect(stored.detailed_review).toBe(testInput.detailed_review);
    expect(stored.featured_image).toBe(testInput.featured_image);
    expect(stored.created_at).toBeInstanceOf(Date);
  });
});
