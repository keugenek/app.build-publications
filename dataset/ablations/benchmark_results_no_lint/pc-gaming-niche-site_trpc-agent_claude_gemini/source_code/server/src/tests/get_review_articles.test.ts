import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { reviewArticlesTable } from '../db/schema';
import { type ReviewQuery, type CreateReviewArticleInput } from '../schema';
import { getReviewArticles } from '../handlers/get_review_articles';

// Helper function to create a slug from product name and brand
const createSlug = (productName: string, brand: string): string => {
  return `${brand}-${productName}`.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
};

// Test data - varied review articles
const testReviews = [
  {
    product_name: 'Gaming Mouse Pro',
    brand: 'TechCorp',
    category: 'mice' as const,
    star_rating: 5,
    price_range: '50_100' as const,
    pros: ['Great precision', 'Comfortable grip'],
    cons: ['Expensive', 'Heavy'],
    review_body: 'This is an excellent gaming mouse with outstanding precision and comfort. The build quality is top-notch.',
    slug: createSlug('Gaming Mouse Pro', 'TechCorp'),
    published: true
  },
  {
    product_name: 'Budget Keyboard',
    brand: 'ValueBrand',
    category: 'keyboards' as const,
    star_rating: 3,
    price_range: 'under_25' as const,
    pros: ['Affordable', 'Quiet keys'],
    cons: ['Flimsy build', 'No backlight'],
    review_body: 'A decent budget keyboard that gets the job done. Good for basic typing but lacks premium features.',
    slug: createSlug('Budget Keyboard', 'ValueBrand'),
    published: false
  },
  {
    product_name: 'Pro Headset X1',
    brand: 'AudioMax',
    category: 'headsets' as const,
    star_rating: 4,
    price_range: '100_plus' as const,
    pros: ['Crystal clear sound', 'Noise cancellation'],
    cons: ['Tight fit', 'Expensive'],
    review_body: 'Outstanding audio quality with excellent noise cancellation. Perfect for professional gaming and streaming.',
    slug: createSlug('Pro Headset X1', 'AudioMax'),
    published: true
  },
  {
    product_name: 'Wireless Mouse Mini',
    brand: 'TechCorp',
    category: 'mice' as const,
    star_rating: 2,
    price_range: '25_50' as const,
    pros: ['Portable', 'Wireless'],
    cons: ['Poor battery life', 'Small size'],
    review_body: 'Compact wireless mouse that is great for travel but suffers from poor battery life and cramped design.',
    slug: createSlug('Wireless Mouse Mini', 'TechCorp'),
    published: true
  }
];

describe('getReviewArticles', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper to insert test data
  const insertTestReviews = async () => {
    await db.insert(reviewArticlesTable)
      .values(testReviews)
      .execute();
  };

  it('should return all reviews with default pagination', async () => {
    await insertTestReviews();
    
    const query: ReviewQuery = {
      limit: 20,
      offset: 0
    };
    
    const results = await getReviewArticles(query);
    
    expect(results).toHaveLength(4);
    
    // Should be ordered by created_at descending (newest first)
    // Since all were inserted at roughly the same time, just verify structure
    expect(results[0]).toHaveProperty('id');
    expect(results[0]).toHaveProperty('product_name');
    expect(results[0]).toHaveProperty('brand');
    expect(results[0]).toHaveProperty('category');
    expect(results[0]).toHaveProperty('star_rating');
    expect(results[0]).toHaveProperty('price_range');
    expect(results[0]).toHaveProperty('pros');
    expect(results[0]).toHaveProperty('cons');
    expect(results[0]).toHaveProperty('review_body');
    expect(results[0]).toHaveProperty('slug');
    expect(results[0]).toHaveProperty('published');
    expect(results[0]).toHaveProperty('created_at');
    expect(results[0]).toHaveProperty('updated_at');
    expect(results[0].created_at).toBeInstanceOf(Date);
    expect(results[0].updated_at).toBeInstanceOf(Date);
  });

  it('should filter by category', async () => {
    await insertTestReviews();
    
    const query: ReviewQuery = {
      category: 'mice',
      limit: 20,
      offset: 0
    };
    
    const results = await getReviewArticles(query);
    
    expect(results).toHaveLength(2);
    results.forEach(result => {
      expect(result.category).toEqual('mice');
    });
    
    // Verify specific products
    const productNames = results.map(r => r.product_name);
    expect(productNames).toContain('Gaming Mouse Pro');
    expect(productNames).toContain('Wireless Mouse Mini');
  });

  it('should filter by brand', async () => {
    await insertTestReviews();
    
    const query: ReviewQuery = {
      brand: 'TechCorp',
      limit: 20,
      offset: 0
    };
    
    const results = await getReviewArticles(query);
    
    expect(results).toHaveLength(2);
    results.forEach(result => {
      expect(result.brand).toEqual('TechCorp');
    });
  });

  it('should filter by price range', async () => {
    await insertTestReviews();
    
    const query: ReviewQuery = {
      price_range: '50_100',
      limit: 20,
      offset: 0
    };
    
    const results = await getReviewArticles(query);
    
    expect(results).toHaveLength(1);
    expect(results[0].product_name).toEqual('Gaming Mouse Pro');
    expect(results[0].price_range).toEqual('50_100');
  });

  it('should filter by published status', async () => {
    await insertTestReviews();
    
    const query: ReviewQuery = {
      published: true,
      limit: 20,
      offset: 0
    };
    
    const results = await getReviewArticles(query);
    
    expect(results).toHaveLength(3);
    results.forEach(result => {
      expect(result.published).toBe(true);
    });
    
    // Test unpublished
    const unpublishedQuery: ReviewQuery = {
      published: false,
      limit: 20,
      offset: 0
    };
    
    const unpublishedResults = await getReviewArticles(unpublishedQuery);
    
    expect(unpublishedResults).toHaveLength(1);
    expect(unpublishedResults[0].product_name).toEqual('Budget Keyboard');
    expect(unpublishedResults[0].published).toBe(false);
  });

  it('should combine multiple filters', async () => {
    await insertTestReviews();
    
    const query: ReviewQuery = {
      category: 'mice',
      brand: 'TechCorp',
      published: true,
      limit: 20,
      offset: 0
    };
    
    const results = await getReviewArticles(query);
    
    expect(results).toHaveLength(2);
    results.forEach(result => {
      expect(result.category).toEqual('mice');
      expect(result.brand).toEqual('TechCorp');
      expect(result.published).toBe(true);
    });
  });

  it('should implement pagination correctly', async () => {
    await insertTestReviews();
    
    // First page
    const firstPageQuery: ReviewQuery = {
      limit: 2,
      offset: 0
    };
    
    const firstPageResults = await getReviewArticles(firstPageQuery);
    expect(firstPageResults).toHaveLength(2);
    
    // Second page
    const secondPageQuery: ReviewQuery = {
      limit: 2,
      offset: 2
    };
    
    const secondPageResults = await getReviewArticles(secondPageQuery);
    expect(secondPageResults).toHaveLength(2);
    
    // Ensure no overlap between pages
    const firstPageIds = firstPageResults.map(r => r.id);
    const secondPageIds = secondPageResults.map(r => r.id);
    
    expect(firstPageIds.filter(id => secondPageIds.includes(id))).toHaveLength(0);
    
    // Third page should be empty
    const thirdPageQuery: ReviewQuery = {
      limit: 2,
      offset: 4
    };
    
    const thirdPageResults = await getReviewArticles(thirdPageQuery);
    expect(thirdPageResults).toHaveLength(0);
  });

  it('should return empty array when no reviews match filters', async () => {
    await insertTestReviews();
    
    const query: ReviewQuery = {
      category: 'headsets',
      brand: 'NonexistentBrand',
      limit: 20,
      offset: 0
    };
    
    const results = await getReviewArticles(query);
    
    expect(results).toHaveLength(0);
  });

  it('should return empty array when database is empty', async () => {
    const query: ReviewQuery = {
      limit: 20,
      offset: 0
    };
    
    const results = await getReviewArticles(query);
    
    expect(results).toHaveLength(0);
  });

  it('should handle complex filtering with edge cases', async () => {
    await insertTestReviews();
    
    // Filter that should match exactly one item
    const query: ReviewQuery = {
      category: 'keyboards',
      price_range: 'under_25',
      published: false,
      limit: 20,
      offset: 0
    };
    
    const results = await getReviewArticles(query);
    
    expect(results).toHaveLength(1);
    expect(results[0].product_name).toEqual('Budget Keyboard');
    expect(results[0].category).toEqual('keyboards');
    expect(results[0].price_range).toEqual('under_25');
    expect(results[0].published).toBe(false);
  });

  it('should properly handle JSON fields in results', async () => {
    await insertTestReviews();
    
    const query: ReviewQuery = {
      limit: 1,
      offset: 0
    };
    
    const results = await getReviewArticles(query);
    
    expect(results).toHaveLength(1);
    expect(Array.isArray(results[0].pros)).toBe(true);
    expect(Array.isArray(results[0].cons)).toBe(true);
    expect(results[0].pros.length).toBeGreaterThan(0);
    expect(results[0].cons.length).toBeGreaterThan(0);
    expect(typeof results[0].pros[0]).toBe('string');
    expect(typeof results[0].cons[0]).toBe('string');
  });
});
