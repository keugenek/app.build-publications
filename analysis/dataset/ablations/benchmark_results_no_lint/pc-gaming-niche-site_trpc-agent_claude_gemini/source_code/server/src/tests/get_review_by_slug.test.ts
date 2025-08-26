import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { reviewArticlesTable } from '../db/schema';
import { type GetReviewBySlugInput } from '../schema';
import { getReviewBySlug } from '../handlers/get_review_by_slug';

describe('getReviewBySlug', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create a test review article
  const createTestReview = async (overrides = {}) => {
    const defaultData = {
      product_name: 'Gaming Mouse Pro',
      brand: 'TechBrand',
      category: 'mice' as const,
      star_rating: 4,
      price_range: '25_50' as const,
      pros: ['Great ergonomics', 'Responsive buttons', 'Good value'],
      cons: ['Could be lighter', 'RGB is too bright'],
      review_body: 'This is a comprehensive review of the Gaming Mouse Pro. It offers excellent performance for the price point and delivers on most fronts.',
      slug: 'gaming-mouse-pro-review',
      published: true
    };

    const data = { ...defaultData, ...overrides };
    
    const results = await db.insert(reviewArticlesTable)
      .values(data)
      .returning()
      .execute();

    return results[0];
  };

  it('should return a review article when found by slug', async () => {
    // Create test review
    const testReview = await createTestReview();

    const input: GetReviewBySlugInput = {
      slug: 'gaming-mouse-pro-review'
    };

    const result = await getReviewBySlug(input);

    expect(result).toBeDefined();
    expect(result!.id).toBe(testReview.id);
    expect(result!.product_name).toBe('Gaming Mouse Pro');
    expect(result!.brand).toBe('TechBrand');
    expect(result!.category).toBe('mice');
    expect(result!.star_rating).toBe(4);
    expect(result!.price_range).toBe('25_50');
    expect(result!.pros).toEqual(['Great ergonomics', 'Responsive buttons', 'Good value']);
    expect(result!.cons).toEqual(['Could be lighter', 'RGB is too bright']);
    expect(result!.review_body).toContain('Gaming Mouse Pro');
    expect(result!.slug).toBe('gaming-mouse-pro-review');
    expect(result!.published).toBe(true);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when review is not found', async () => {
    const input: GetReviewBySlugInput = {
      slug: 'non-existent-review'
    };

    const result = await getReviewBySlug(input);

    expect(result).toBeNull();
  });

  it('should handle empty slug gracefully', async () => {
    const input: GetReviewBySlugInput = {
      slug: ''
    };

    const result = await getReviewBySlug(input);

    expect(result).toBeNull();
  });

  it('should return unpublished review when found by slug', async () => {
    // Create unpublished review
    await createTestReview({
      slug: 'unpublished-review',
      published: false,
      product_name: 'Unpublished Product'
    });

    const input: GetReviewBySlugInput = {
      slug: 'unpublished-review'
    };

    const result = await getReviewBySlug(input);

    expect(result).toBeDefined();
    expect(result!.published).toBe(false);
    expect(result!.product_name).toBe('Unpublished Product');
  });

  it('should handle special characters in slug', async () => {
    await createTestReview({
      slug: 'special-chars-review-123',
      product_name: 'Special Product'
    });

    const input: GetReviewBySlugInput = {
      slug: 'special-chars-review-123'
    };

    const result = await getReviewBySlug(input);

    expect(result).toBeDefined();
    expect(result!.slug).toBe('special-chars-review-123');
    expect(result!.product_name).toBe('Special Product');
  });

  it('should properly handle JSON arrays for pros and cons', async () => {
    await createTestReview({
      slug: 'json-test-review',
      pros: ['Pro 1', 'Pro 2', 'Pro 3'],
      cons: ['Con 1', 'Con 2']
    });

    const input: GetReviewBySlugInput = {
      slug: 'json-test-review'
    };

    const result = await getReviewBySlug(input);

    expect(result).toBeDefined();
    expect(Array.isArray(result!.pros)).toBe(true);
    expect(Array.isArray(result!.cons)).toBe(true);
    expect(result!.pros).toHaveLength(3);
    expect(result!.cons).toHaveLength(2);
    expect(result!.pros).toEqual(['Pro 1', 'Pro 2', 'Pro 3']);
    expect(result!.cons).toEqual(['Con 1', 'Con 2']);
  });

  it('should handle different product categories', async () => {
    // Test keyboards category
    await createTestReview({
      slug: 'keyboard-review',
      category: 'keyboards',
      product_name: 'Mechanical Keyboard'
    });

    const keyboardInput: GetReviewBySlugInput = {
      slug: 'keyboard-review'
    };

    const keyboardResult = await getReviewBySlug(keyboardInput);

    expect(keyboardResult).toBeDefined();
    expect(keyboardResult!.category).toBe('keyboards');
    expect(keyboardResult!.product_name).toBe('Mechanical Keyboard');

    // Test headsets category
    await createTestReview({
      slug: 'headset-review',
      category: 'headsets',
      product_name: 'Gaming Headset'
    });

    const headsetInput: GetReviewBySlugInput = {
      slug: 'headset-review'
    };

    const headsetResult = await getReviewBySlug(headsetInput);

    expect(headsetResult).toBeDefined();
    expect(headsetResult!.category).toBe('headsets');
    expect(headsetResult!.product_name).toBe('Gaming Headset');
  });

  it('should handle different price ranges', async () => {
    await createTestReview({
      slug: 'expensive-review',
      price_range: '100_plus',
      product_name: 'Premium Product'
    });

    const input: GetReviewBySlugInput = {
      slug: 'expensive-review'
    };

    const result = await getReviewBySlug(input);

    expect(result).toBeDefined();
    expect(result!.price_range).toBe('100_plus');
    expect(result!.product_name).toBe('Premium Product');
  });

  it('should handle case-sensitive slug matching', async () => {
    await createTestReview({
      slug: 'case-sensitive-review'
    });

    // Should not find with different case
    const wrongCaseInput: GetReviewBySlugInput = {
      slug: 'Case-Sensitive-Review'
    };

    const wrongCaseResult = await getReviewBySlug(wrongCaseInput);
    expect(wrongCaseResult).toBeNull();

    // Should find with exact case
    const correctCaseInput: GetReviewBySlugInput = {
      slug: 'case-sensitive-review'
    };

    const correctCaseResult = await getReviewBySlug(correctCaseInput);
    expect(correctCaseResult).toBeDefined();
  });
});
