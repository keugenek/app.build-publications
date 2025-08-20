import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { reviewArticlesTable } from '../db/schema';
import { getReviewStats } from '../handlers/get_review_stats';

// Helper function to create a test review article
const createTestReview = async (overrides: any = {}) => {
  const defaultReview = {
    product_name: 'Test Product',
    brand: 'Test Brand',
    category: 'mice',
    star_rating: 4,
    price_range: '25_50',
    pros: ['Great performance', 'Good value'],
    cons: ['Could be better'],
    review_body: 'This is a detailed review of the test product with more than 50 characters.',
    slug: `test-product-${Date.now()}-${Math.random()}`,
    published: false,
    ...overrides
  };

  const result = await db.insert(reviewArticlesTable)
    .values(defaultReview)
    .returning()
    .execute();

  return result[0];
};

describe('getReviewStats', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return zero stats when no reviews exist', async () => {
    const stats = await getReviewStats();

    expect(stats.total_reviews).toEqual(0);
    expect(stats.published_reviews).toEqual(0);
    expect(stats.draft_reviews).toEqual(0);
    expect(stats.reviews_by_category.mice).toEqual(0);
    expect(stats.reviews_by_category.keyboards).toEqual(0);
    expect(stats.reviews_by_category.headsets).toEqual(0);
    expect(stats.average_rating).toEqual(0);
  });

  it('should count total reviews correctly', async () => {
    // Create multiple reviews
    await createTestReview({ slug: 'test-1' });
    await createTestReview({ slug: 'test-2' });
    await createTestReview({ slug: 'test-3' });

    const stats = await getReviewStats();

    expect(stats.total_reviews).toEqual(3);
  });

  it('should count published vs draft reviews correctly', async () => {
    // Create published reviews
    await createTestReview({ slug: 'published-1', published: true });
    await createTestReview({ slug: 'published-2', published: true });
    
    // Create draft reviews
    await createTestReview({ slug: 'draft-1', published: false });
    await createTestReview({ slug: 'draft-2', published: false });
    await createTestReview({ slug: 'draft-3', published: false });

    const stats = await getReviewStats();

    expect(stats.total_reviews).toEqual(5);
    expect(stats.published_reviews).toEqual(2);
    expect(stats.draft_reviews).toEqual(3);
  });

  it('should count reviews by category correctly', async () => {
    // Create reviews for different categories
    await createTestReview({ slug: 'mice-1', category: 'mice' });
    await createTestReview({ slug: 'mice-2', category: 'mice' });
    await createTestReview({ slug: 'keyboards-1', category: 'keyboards' });
    await createTestReview({ slug: 'keyboards-2', category: 'keyboards' });
    await createTestReview({ slug: 'keyboards-3', category: 'keyboards' });
    await createTestReview({ slug: 'headsets-1', category: 'headsets' });

    const stats = await getReviewStats();

    expect(stats.total_reviews).toEqual(6);
    expect(stats.reviews_by_category.mice).toEqual(2);
    expect(stats.reviews_by_category.keyboards).toEqual(3);
    expect(stats.reviews_by_category.headsets).toEqual(1);
  });

  it('should calculate average rating correctly', async () => {
    // Create reviews with different ratings
    await createTestReview({ slug: 'rating-1', star_rating: 5 });
    await createTestReview({ slug: 'rating-2', star_rating: 4 });
    await createTestReview({ slug: 'rating-3', star_rating: 3 });
    await createTestReview({ slug: 'rating-4', star_rating: 2 });

    const stats = await getReviewStats();

    expect(stats.total_reviews).toEqual(4);
    expect(stats.average_rating).toEqual(3.5); // (5+4+3+2)/4 = 3.5
  });

  it('should handle mixed data correctly', async () => {
    // Create a comprehensive mix of reviews
    await createTestReview({ 
      slug: 'comprehensive-1', 
      category: 'mice', 
      star_rating: 5, 
      published: true 
    });
    await createTestReview({ 
      slug: 'comprehensive-2', 
      category: 'keyboards', 
      star_rating: 4, 
      published: true 
    });
    await createTestReview({ 
      slug: 'comprehensive-3', 
      category: 'headsets', 
      star_rating: 3, 
      published: false 
    });
    await createTestReview({ 
      slug: 'comprehensive-4', 
      category: 'mice', 
      star_rating: 2, 
      published: false 
    });

    const stats = await getReviewStats();

    // Verify all counts
    expect(stats.total_reviews).toEqual(4);
    expect(stats.published_reviews).toEqual(2);
    expect(stats.draft_reviews).toEqual(2);
    
    // Verify category breakdown
    expect(stats.reviews_by_category.mice).toEqual(2);
    expect(stats.reviews_by_category.keyboards).toEqual(1);
    expect(stats.reviews_by_category.headsets).toEqual(1);
    
    // Verify average rating: (5+4+3+2)/4 = 3.5
    expect(stats.average_rating).toEqual(3.5);
  });

  it('should handle single review correctly', async () => {
    await createTestReview({ 
      slug: 'single-review', 
      category: 'headsets', 
      star_rating: 4, 
      published: true 
    });

    const stats = await getReviewStats();

    expect(stats.total_reviews).toEqual(1);
    expect(stats.published_reviews).toEqual(1);
    expect(stats.draft_reviews).toEqual(0);
    expect(stats.reviews_by_category.mice).toEqual(0);
    expect(stats.reviews_by_category.keyboards).toEqual(0);
    expect(stats.reviews_by_category.headsets).toEqual(1);
    expect(stats.average_rating).toEqual(4);
  });

  it('should round average rating to appropriate precision', async () => {
    // Create reviews that will result in a non-integer average
    await createTestReview({ slug: 'precision-1', star_rating: 5 });
    await createTestReview({ slug: 'precision-2', star_rating: 4 });
    await createTestReview({ slug: 'precision-3', star_rating: 4 });

    const stats = await getReviewStats();

    expect(stats.total_reviews).toEqual(3);
    // (5+4+4)/3 = 4.333...
    expect(stats.average_rating).toBeCloseTo(4.333333, 5);
  });
});
