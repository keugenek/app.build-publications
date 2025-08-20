import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productReviewsTable } from '../db/schema';
import { type GetReviewsQuery, type CreateProductReviewInput } from '../schema';
import { getProductReviews } from '../handlers/get_product_reviews';

// Test data for creating reviews
const testReview1: CreateProductReviewInput = {
  product_name: 'Gaming Mouse Pro',
  brand: 'Logitech',
  category: 'mice',
  rating: 8.5,
  pros: ['High DPI', 'Comfortable grip', 'RGB lighting'],
  cons: ['Expensive', 'Heavy'],
  review_text: 'This is an excellent gaming mouse with great precision and comfort.',
  image_urls: ['https://example.com/mouse1.jpg', 'https://example.com/mouse2.jpg'],
  is_published: true
};

const testReview2: CreateProductReviewInput = {
  product_name: 'Mechanical Keyboard',
  brand: 'Corsair',
  category: 'keyboards',
  rating: 9.2,
  pros: ['Tactile switches', 'Durable build', 'Good lighting'],
  cons: ['Loud clicks'],
  review_text: 'Amazing mechanical keyboard with excellent build quality and responsive keys.',
  image_urls: ['https://example.com/keyboard1.jpg'],
  is_published: true
};

const testReview3: CreateProductReviewInput = {
  product_name: 'Budget Headset',
  brand: 'HyperX',
  category: 'headsets',
  rating: 6.5,
  pros: ['Affordable', 'Decent sound'],
  cons: ['Poor build quality', 'Uncomfortable'],
  review_text: 'Budget headset that gets the job done but has some quality issues.',
  image_urls: [],
  is_published: false // Unpublished review
};

const testReview4: CreateProductReviewInput = {
  product_name: 'Pro Gaming Mouse',
  brand: 'Logitech', // Same brand as testReview1
  category: 'mice',
  rating: 7.8,
  pros: ['Lightweight', 'Good sensor'],
  cons: ['Battery life could be better'],
  review_text: 'Solid wireless gaming mouse with good performance for competitive gaming.',
  image_urls: ['https://example.com/mouse3.jpg'],
  is_published: true
};

describe('getProductReviews', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create test reviews
  const createTestReviews = async () => {
    const reviews = [
      {
        product_name: testReview1.product_name,
        brand: testReview1.brand,
        category: testReview1.category,
        rating: testReview1.rating,
        pros: testReview1.pros,
        cons: testReview1.cons,
        review_text: testReview1.review_text,
        image_urls: testReview1.image_urls,
        is_published: testReview1.is_published
      },
      {
        product_name: testReview2.product_name,
        brand: testReview2.brand,
        category: testReview2.category,
        rating: testReview2.rating,
        pros: testReview2.pros,
        cons: testReview2.cons,
        review_text: testReview2.review_text,
        image_urls: testReview2.image_urls,
        is_published: testReview2.is_published
      },
      {
        product_name: testReview3.product_name,
        brand: testReview3.brand,
        category: testReview3.category,
        rating: testReview3.rating,
        pros: testReview3.pros,
        cons: testReview3.cons,
        review_text: testReview3.review_text,
        image_urls: testReview3.image_urls,
        is_published: testReview3.is_published
      },
      {
        product_name: testReview4.product_name,
        brand: testReview4.brand,
        category: testReview4.category,
        rating: testReview4.rating,
        pros: testReview4.pros,
        cons: testReview4.cons,
        review_text: testReview4.review_text,
        image_urls: testReview4.image_urls,
        is_published: testReview4.is_published
      }
    ];

    for (const review of reviews) {
      await db.insert(productReviewsTable).values(review).execute();
    }
  };

  it('should return all reviews with default pagination', async () => {
    await createTestReviews();

    const query: GetReviewsQuery = {
      limit: 20,
      offset: 0
    };

    const results = await getProductReviews(query);

    expect(results).toHaveLength(4);
    
    // Verify all reviews are returned with proper field types
    results.forEach(review => {
      expect(review.id).toBeDefined();
      expect(typeof review.product_name).toBe('string');
      expect(typeof review.brand).toBe('string');
      expect(typeof review.category).toBe('string');
      expect(typeof review.rating).toBe('number'); // Should be converted to number
      expect(Array.isArray(review.pros)).toBe(true);
      expect(Array.isArray(review.cons)).toBe(true);
      expect(typeof review.review_text).toBe('string');
      expect(Array.isArray(review.image_urls)).toBe(true);
      expect(typeof review.is_published).toBe('boolean');
      expect(review.created_at).toBeInstanceOf(Date);
    });

    // Verify results are ordered by created_at DESC (newest first)
    for (let i = 1; i < results.length; i++) {
      expect(results[i-1].created_at >= results[i].created_at).toBe(true);
    }
  });

  it('should filter by category', async () => {
    await createTestReviews();

    const query: GetReviewsQuery = {
      category: 'mice',
      limit: 20,
      offset: 0
    };

    const results = await getProductReviews(query);

    expect(results).toHaveLength(2);
    results.forEach(review => {
      expect(review.category).toBe('mice');
    });
  });

  it('should filter by published status', async () => {
    await createTestReviews();

    // Test published reviews
    const publishedQuery: GetReviewsQuery = {
      is_published: true,
      limit: 20,
      offset: 0
    };

    const publishedResults = await getProductReviews(publishedQuery);
    expect(publishedResults).toHaveLength(3);
    publishedResults.forEach(review => {
      expect(review.is_published).toBe(true);
    });

    // Test unpublished reviews
    const unpublishedQuery: GetReviewsQuery = {
      is_published: false,
      limit: 20,
      offset: 0
    };

    const unpublishedResults = await getProductReviews(unpublishedQuery);
    expect(unpublishedResults).toHaveLength(1);
    expect(unpublishedResults[0].is_published).toBe(false);
    expect(unpublishedResults[0].product_name).toBe('Budget Headset');
  });

  it('should filter by brand', async () => {
    await createTestReviews();

    const query: GetReviewsQuery = {
      brand: 'Logitech',
      limit: 20,
      offset: 0
    };

    const results = await getProductReviews(query);

    expect(results).toHaveLength(2);
    results.forEach(review => {
      expect(review.brand).toBe('Logitech');
    });
  });

  it('should apply multiple filters', async () => {
    await createTestReviews();

    const query: GetReviewsQuery = {
      category: 'mice',
      brand: 'Logitech',
      is_published: true,
      limit: 20,
      offset: 0
    };

    const results = await getProductReviews(query);

    expect(results).toHaveLength(2);
    results.forEach(review => {
      expect(review.category).toBe('mice');
      expect(review.brand).toBe('Logitech');
      expect(review.is_published).toBe(true);
    });
  });

  it('should handle pagination correctly', async () => {
    await createTestReviews();

    // First page
    const firstPageQuery: GetReviewsQuery = {
      limit: 2,
      offset: 0
    };

    const firstPage = await getProductReviews(firstPageQuery);
    expect(firstPage).toHaveLength(2);

    // Second page
    const secondPageQuery: GetReviewsQuery = {
      limit: 2,
      offset: 2
    };

    const secondPage = await getProductReviews(secondPageQuery);
    expect(secondPage).toHaveLength(2);

    // Verify no overlap between pages
    const firstPageIds = firstPage.map(review => review.id);
    const secondPageIds = secondPage.map(review => review.id);
    const overlap = firstPageIds.filter(id => secondPageIds.includes(id));
    expect(overlap).toHaveLength(0);

    // Third page (beyond available data)
    const thirdPageQuery: GetReviewsQuery = {
      limit: 2,
      offset: 4
    };

    const thirdPage = await getProductReviews(thirdPageQuery);
    expect(thirdPage).toHaveLength(0);
  });

  it('should return empty array when no reviews match filters', async () => {
    await createTestReviews();

    const query: GetReviewsQuery = {
      category: 'mousepads', // No mousepads in test data
      limit: 20,
      offset: 0
    };

    const results = await getProductReviews(query);
    expect(results).toHaveLength(0);
  });

  it('should return empty array when no reviews exist', async () => {
    // Don't create any test data

    const query: GetReviewsQuery = {
      limit: 20,
      offset: 0
    };

    const results = await getProductReviews(query);
    expect(results).toHaveLength(0);
  });

  it('should handle numeric rating conversion correctly', async () => {
    await createTestReviews();

    const results = await getProductReviews({
      limit: 20,
      offset: 0
    });

    expect(results.length).toBeGreaterThan(0);
    
    // Find the specific review we know the rating for
    const mouseReview = results.find(review => review.product_name === 'Gaming Mouse Pro');
    expect(mouseReview).toBeDefined();
    expect(typeof mouseReview!.rating).toBe('number');
    expect(mouseReview!.rating).toBe(8.5);

    const keyboardReview = results.find(review => review.product_name === 'Mechanical Keyboard');
    expect(keyboardReview).toBeDefined();
    expect(typeof keyboardReview!.rating).toBe('number');
    expect(keyboardReview!.rating).toBe(9.2);
  });

  it('should preserve array fields correctly', async () => {
    await createTestReviews();

    const results = await getProductReviews({
      limit: 20,
      offset: 0
    });

    const mouseReview = results.find(review => review.product_name === 'Gaming Mouse Pro');
    expect(mouseReview).toBeDefined();
    
    // Verify pros array
    expect(Array.isArray(mouseReview!.pros)).toBe(true);
    expect(mouseReview!.pros).toEqual(['High DPI', 'Comfortable grip', 'RGB lighting']);
    
    // Verify cons array
    expect(Array.isArray(mouseReview!.cons)).toBe(true);
    expect(mouseReview!.cons).toEqual(['Expensive', 'Heavy']);
    
    // Verify image URLs array
    expect(Array.isArray(mouseReview!.image_urls)).toBe(true);
    expect(mouseReview!.image_urls).toEqual(['https://example.com/mouse1.jpg', 'https://example.com/mouse2.jpg']);
  });
});
