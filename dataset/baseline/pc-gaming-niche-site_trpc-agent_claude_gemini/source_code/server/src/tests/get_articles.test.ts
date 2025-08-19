import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { articlesTable } from '../db/schema';
import { type CreateArticleInput } from '../schema';
import { getArticles } from '../handlers/get_articles';

// Test article data
const testArticle1: Omit<CreateArticleInput, 'id'> = {
  product_name: 'Gaming Mouse Pro',
  category: 'mice',
  price: 79.99,
  overall_rating: 4.5,
  short_description: 'High-performance gaming mouse with RGB lighting',
  detailed_review: 'This mouse delivers exceptional performance for gaming with its high-precision sensor and customizable buttons.',
  pros: ['High DPI sensor', 'Comfortable grip', 'RGB lighting'],
  cons: ['Expensive', 'Software could be better'],
  main_image_url: 'https://example.com/mouse1.jpg'
};

const testArticle2: Omit<CreateArticleInput, 'id'> = {
  product_name: 'Mechanical Keyboard Elite',
  category: 'keyboards',
  price: 129.99,
  overall_rating: 5.0,
  short_description: 'Premium mechanical keyboard with Cherry MX switches',
  detailed_review: 'The best mechanical keyboard for both gaming and typing with excellent build quality.',
  pros: ['Cherry MX switches', 'Solid build quality', 'Excellent typing feel'],
  cons: ['Loud switches', 'No wireless option'],
  main_image_url: null // Test null image URL
};

const testArticle3: Omit<CreateArticleInput, 'id'> = {
  product_name: 'Wireless Headset Supreme',
  category: 'headsets',
  price: 199.99,
  overall_rating: 3.8,
  short_description: 'Wireless gaming headset with noise cancellation',
  detailed_review: 'Decent wireless headset with good sound quality but average battery life.',
  pros: ['Wireless freedom', 'Good sound quality', 'Noise cancellation'],
  cons: ['Poor battery life', 'Heavy weight', 'Expensive for the quality'],
  main_image_url: 'https://example.com/headset1.jpg'
};

describe('getArticles', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no articles exist', async () => {
    const result = await getArticles();

    expect(result).toEqual([]);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return all articles with correct data types', async () => {
    // Insert test articles directly to database
    await db.insert(articlesTable).values([
      {
        product_name: testArticle1.product_name,
        category: testArticle1.category,
        price: testArticle1.price.toString(),
        overall_rating: testArticle1.overall_rating.toString(),
        short_description: testArticle1.short_description,
        detailed_review: testArticle1.detailed_review,
        pros: testArticle1.pros,
        cons: testArticle1.cons,
        main_image_url: testArticle1.main_image_url
      },
      {
        product_name: testArticle2.product_name,
        category: testArticle2.category,
        price: testArticle2.price.toString(),
        overall_rating: testArticle2.overall_rating.toString(),
        short_description: testArticle2.short_description,
        detailed_review: testArticle2.detailed_review,
        pros: testArticle2.pros,
        cons: testArticle2.cons,
        main_image_url: testArticle2.main_image_url
      }
    ]).execute();

    const result = await getArticles();

    expect(result).toHaveLength(2);

    // Verify data types and content
    result.forEach(article => {
      expect(typeof article.id).toBe('number');
      expect(typeof article.product_name).toBe('string');
      expect(['mice', 'keyboards', 'headsets']).toContain(article.category);
      expect(typeof article.price).toBe('number'); // Should be converted from string
      expect(typeof article.overall_rating).toBe('number'); // Should be converted from string
      expect(typeof article.short_description).toBe('string');
      expect(typeof article.detailed_review).toBe('string');
      expect(Array.isArray(article.pros)).toBe(true);
      expect(Array.isArray(article.cons)).toBe(true);
      expect(article.created_at).toBeInstanceOf(Date);
      expect(article.updated_at).toBeInstanceOf(Date);
    });

    // Verify specific numeric conversions
    const mouseArticle = result.find(a => a.product_name === 'Gaming Mouse Pro');
    expect(mouseArticle?.price).toBe(79.99);
    expect(mouseArticle?.overall_rating).toBe(4.5);

    const keyboardArticle = result.find(a => a.product_name === 'Mechanical Keyboard Elite');
    expect(keyboardArticle?.price).toBe(129.99);
    expect(keyboardArticle?.overall_rating).toBe(5.0);
  });

  it('should return articles ordered by creation date (newest first)', async () => {
    // Insert articles with slight delay to ensure different timestamps
    await db.insert(articlesTable).values({
      product_name: 'First Article',
      category: 'mice',
      price: '50.00',
      overall_rating: '4.0',
      short_description: 'First test article',
      detailed_review: 'First detailed review',
      pros: ['Pro 1'],
      cons: ['Con 1'],
      main_image_url: null
    }).execute();

    // Small delay to ensure different timestamp
    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(articlesTable).values({
      product_name: 'Second Article',
      category: 'keyboards',
      price: '100.00',
      overall_rating: '5.0',
      short_description: 'Second test article',
      detailed_review: 'Second detailed review',
      pros: ['Pro 2'],
      cons: ['Con 2'],
      main_image_url: null
    }).execute();

    const result = await getArticles();

    expect(result).toHaveLength(2);
    // Newest article should be first
    expect(result[0].product_name).toBe('Second Article');
    expect(result[1].product_name).toBe('First Article');

    // Verify ordering by dates
    expect(result[0].created_at.getTime()).toBeGreaterThan(result[1].created_at.getTime());
  });

  it('should handle articles with null image URLs', async () => {
    await db.insert(articlesTable).values({
      product_name: testArticle2.product_name,
      category: testArticle2.category,
      price: testArticle2.price.toString(),
      overall_rating: testArticle2.overall_rating.toString(),
      short_description: testArticle2.short_description,
      detailed_review: testArticle2.detailed_review,
      pros: testArticle2.pros,
      cons: testArticle2.cons,
      main_image_url: testArticle2.main_image_url // null
    }).execute();

    const result = await getArticles();

    expect(result).toHaveLength(1);
    expect(result[0].main_image_url).toBeNull();
    expect(result[0].product_name).toBe('Mechanical Keyboard Elite');
  });

  it('should handle all product categories correctly', async () => {
    // Insert one article for each category
    await db.insert(articlesTable).values([
      {
        product_name: 'Test Mouse',
        category: 'mice',
        price: '50.00',
        overall_rating: '4.0',
        short_description: 'Mouse description',
        detailed_review: 'Mouse review',
        pros: ['Mouse pro'],
        cons: ['Mouse con'],
        main_image_url: null
      },
      {
        product_name: 'Test Keyboard',
        category: 'keyboards',
        price: '100.00',
        overall_rating: '5.0',
        short_description: 'Keyboard description',
        detailed_review: 'Keyboard review',
        pros: ['Keyboard pro'],
        cons: ['Keyboard con'],
        main_image_url: null
      },
      {
        product_name: 'Test Headset',
        category: 'headsets',
        price: '150.00',
        overall_rating: '3.5',
        short_description: 'Headset description',
        detailed_review: 'Headset review',
        pros: ['Headset pro'],
        cons: ['Headset con'],
        main_image_url: null
      }
    ]).execute();

    const result = await getArticles();

    expect(result).toHaveLength(3);

    const categories = result.map(article => article.category);
    expect(categories).toContain('mice');
    expect(categories).toContain('keyboards');
    expect(categories).toContain('headsets');

    // Verify each category has correct data
    result.forEach(article => {
      expect(['mice', 'keyboards', 'headsets']).toContain(article.category);
      expect(typeof article.price).toBe('number');
      expect(typeof article.overall_rating).toBe('number');
    });
  });

  it('should preserve JSON arrays for pros and cons', async () => {
    await db.insert(articlesTable).values({
      product_name: testArticle3.product_name,
      category: testArticle3.category,
      price: testArticle3.price.toString(),
      overall_rating: testArticle3.overall_rating.toString(),
      short_description: testArticle3.short_description,
      detailed_review: testArticle3.detailed_review,
      pros: testArticle3.pros,
      cons: testArticle3.cons,
      main_image_url: testArticle3.main_image_url
    }).execute();

    const result = await getArticles();

    expect(result).toHaveLength(1);
    
    const article = result[0];
    expect(Array.isArray(article.pros)).toBe(true);
    expect(Array.isArray(article.cons)).toBe(true);
    expect(article.pros).toEqual(['Wireless freedom', 'Good sound quality', 'Noise cancellation']);
    expect(article.cons).toEqual(['Poor battery life', 'Heavy weight', 'Expensive for the quality']);
  });
});
