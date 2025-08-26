import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable, reviewArticlesTable } from '../db/schema';
import { type GetReviewArticlesQuery } from '../schema';
import { getReviewArticles } from '../handlers/get_review_articles';

// Test data
const testCategory = {
  name: 'Electronics',
  description: 'Electronic devices and gadgets'
};

const testCategory2 = {
  name: 'Home & Kitchen',
  description: 'Home and kitchen appliances'
};

const testReviewArticle1 = {
  title: 'Amazing Smartphone Review',
  brand: 'TechCorp',
  model: 'SuperPhone X',
  star_rating: '4.5',
  pros: 'Great battery life, excellent camera',
  cons: 'Expensive, no headphone jack',
  main_image_url: 'https://example.com/phone.jpg',
  review_content: 'This smartphone is truly exceptional...',
  published_at: new Date('2023-12-01')
};

const testReviewArticle2 = {
  title: 'Coffee Maker Excellence',
  brand: 'BrewMaster',
  model: 'Elite Pro',
  star_rating: '5.0',
  pros: 'Perfect brew temperature, easy to clean',
  cons: 'Takes up counter space',
  main_image_url: null,
  review_content: 'The best coffee maker I have ever used...',
  published_at: new Date('2023-12-02')
};

const testReviewArticle3 = {
  title: 'Budget Headphones Review',
  brand: 'AudioTech',
  model: 'BassBoom 200',
  star_rating: '3.5',
  pros: 'Affordable, decent sound quality',
  cons: 'Build quality could be better, limited features',
  main_image_url: 'https://example.com/headphones.jpg',
  review_content: 'For the price, these headphones are quite good...',
  published_at: new Date('2023-11-30')
};

describe('getReviewArticles', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should fetch all review articles with category information', async () => {
    // Create test categories
    const categories = await db.insert(categoriesTable)
      .values([testCategory, testCategory2])
      .returning()
      .execute();

    // Create test review articles
    const reviewArticles = await db.insert(reviewArticlesTable)
      .values([
        { ...testReviewArticle1, category_id: categories[0].id },
        { ...testReviewArticle2, category_id: categories[1].id },
        { ...testReviewArticle3, category_id: categories[0].id }
      ])
      .returning()
      .execute();

    const query: GetReviewArticlesQuery = {};
    const results = await getReviewArticles(query);

    // Should return all articles ordered by published_at DESC
    expect(results).toHaveLength(3);
    expect(results[0].title).toEqual('Coffee Maker Excellence'); // Most recent
    expect(results[1].title).toEqual('Amazing Smartphone Review');
    expect(results[2].title).toEqual('Budget Headphones Review'); // Oldest

    // Verify all fields are present and correctly typed
    const firstResult = results[0];
    expect(firstResult.id).toBeDefined();
    expect(firstResult.title).toEqual('Coffee Maker Excellence');
    expect(firstResult.category_id).toEqual(categories[1].id);
    expect(firstResult.brand).toEqual('BrewMaster');
    expect(firstResult.model).toEqual('Elite Pro');
    expect(typeof firstResult.star_rating).toEqual('number');
    expect(firstResult.star_rating).toEqual(5.0);
    expect(firstResult.pros).toEqual('Perfect brew temperature, easy to clean');
    expect(firstResult.cons).toEqual('Takes up counter space');
    expect(firstResult.main_image_url).toBeNull();
    expect(firstResult.review_content).toEqual('The best coffee maker I have ever used...');
    expect(firstResult.published_at).toBeInstanceOf(Date);
    expect(firstResult.created_at).toBeInstanceOf(Date);
    expect(firstResult.updated_at).toBeInstanceOf(Date);

    // Verify category information is included
    expect(firstResult.category.name).toEqual('Home & Kitchen');
    expect(firstResult.category.description).toEqual('Home and kitchen appliances');
  });

  it('should filter by category_id when provided', async () => {
    // Create test categories
    const categories = await db.insert(categoriesTable)
      .values([testCategory, testCategory2])
      .returning()
      .execute();

    // Create test review articles
    await db.insert(reviewArticlesTable)
      .values([
        { ...testReviewArticle1, category_id: categories[0].id },
        { ...testReviewArticle2, category_id: categories[1].id },
        { ...testReviewArticle3, category_id: categories[0].id }
      ])
      .returning()
      .execute();

    const query: GetReviewArticlesQuery = {
      category_id: categories[0].id // Electronics category
    };
    const results = await getReviewArticles(query);

    // Should return only electronics articles
    expect(results).toHaveLength(2);
    expect(results[0].title).toEqual('Amazing Smartphone Review');
    expect(results[1].title).toEqual('Budget Headphones Review');
    
    // Both should have the same category
    results.forEach(result => {
      expect(result.category_id).toEqual(categories[0].id);
      expect(result.category.name).toEqual('Electronics');
    });
  });

  it('should apply pagination correctly', async () => {
    // Create test category
    const categories = await db.insert(categoriesTable)
      .values([testCategory])
      .returning()
      .execute();

    // Create multiple test review articles
    const reviewArticles = [];
    for (let i = 0; i < 5; i++) {
      reviewArticles.push({
        ...testReviewArticle1,
        title: `Review Article ${i + 1}`,
        category_id: categories[0].id,
        published_at: new Date(`2023-12-${String(i + 1).padStart(2, '0')}`)
      });
    }

    await db.insert(reviewArticlesTable)
      .values(reviewArticles)
      .returning()
      .execute();

    // Test with limit
    const query1: GetReviewArticlesQuery = { limit: 2 };
    const results1 = await getReviewArticles(query1);
    expect(results1).toHaveLength(2);
    expect(results1[0].title).toEqual('Review Article 5'); // Most recent

    // Test with offset
    const query2: GetReviewArticlesQuery = { limit: 2, offset: 2 };
    const results2 = await getReviewArticles(query2);
    expect(results2).toHaveLength(2);
    expect(results2[0].title).toEqual('Review Article 3');

    // Test with large offset
    const query3: GetReviewArticlesQuery = { limit: 10, offset: 10 };
    const results3 = await getReviewArticles(query3);
    expect(results3).toHaveLength(0);
  });

  it('should handle empty results gracefully', async () => {
    const query: GetReviewArticlesQuery = {};
    const results = await getReviewArticles(query);

    expect(results).toHaveLength(0);
  });

  it('should handle non-existent category_id filter', async () => {
    // Create test category and review article
    const categories = await db.insert(categoriesTable)
      .values([testCategory])
      .returning()
      .execute();

    await db.insert(reviewArticlesTable)
      .values([{ ...testReviewArticle1, category_id: categories[0].id }])
      .returning()
      .execute();

    const query: GetReviewArticlesQuery = {
      category_id: 99999 // Non-existent category
    };
    const results = await getReviewArticles(query);

    expect(results).toHaveLength(0);
  });

  it('should use default pagination values when not provided', async () => {
    // Create test category
    const categories = await db.insert(categoriesTable)
      .values([testCategory])
      .returning()
      .execute();

    // Create 25 test review articles to test default limit
    const reviewArticles = [];
    for (let i = 0; i < 25; i++) {
      reviewArticles.push({
        ...testReviewArticle1,
        title: `Review Article ${i + 1}`,
        category_id: categories[0].id,
        published_at: new Date(`2023-12-${String((i % 28) + 1).padStart(2, '0')}`)
      });
    }

    await db.insert(reviewArticlesTable)
      .values(reviewArticles)
      .returning()
      .execute();

    const query: GetReviewArticlesQuery = {}; // No limit/offset specified
    const results = await getReviewArticles(query);

    // Should return default limit of 20
    expect(results).toHaveLength(20);
  });

  it('should correctly convert numeric star_rating field', async () => {
    // Create test category
    const categories = await db.insert(categoriesTable)
      .values([testCategory])
      .returning()
      .execute();

    // Create review article with decimal rating
    await db.insert(reviewArticlesTable)
      .values([{ ...testReviewArticle1, category_id: categories[0].id }])
      .returning()
      .execute();

    const query: GetReviewArticlesQuery = {};
    const results = await getReviewArticles(query);

    expect(results).toHaveLength(1);
    expect(typeof results[0].star_rating).toEqual('number');
    expect(results[0].star_rating).toEqual(4.5);
  });
});
