import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { reviewArticles } from '../db/schema';
import { type ReviewArticle } from '../schema';
import { getReviews } from '../handlers/get_reviews';
import { eq } from 'drizzle-orm';

// Sample review input
const sampleReview = {
  product_name: 'Super Mouse',
  category: 'Mice' as const,
  brand: 'Logitech',
  overall_rating: 4,
  pros: ['Precision', 'Ergonomic'],
  cons: ['Expensive'],
  detailed_review: 'Great mouse for gaming and productivity.',
  featured_image: 'https://example.com/mouse.png'
};

describe('getReviews handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return an empty array when no reviews exist', async () => {
    const reviews = await getReviews();
    expect(reviews).toBeInstanceOf(Array);
    expect(reviews).toHaveLength(0);
  });

  it('should return all review articles from the database', async () => {
    // Insert a review directly via Drizzle
    await db.insert(reviewArticles).values(sampleReview).execute();

    const reviews = await getReviews();
    expect(reviews).toHaveLength(1);
    const review = reviews[0];
    expect(review.product_name).toBe('Super Mouse');
    expect(review.category).toBe('Mice');
    expect(review.brand).toBe('Logitech');
    expect(review.overall_rating).toBe(4);
    expect(review.pros).toEqual(['Precision', 'Ergonomic']);
    expect(review.cons).toEqual(['Expensive']);
    expect(review.detailed_review).toBe('Great mouse for gaming and productivity.');
    expect(review.featured_image).toBe('https://example.com/mouse.png');
    expect(review.created_at).toBeInstanceOf(Date);
  });
});
