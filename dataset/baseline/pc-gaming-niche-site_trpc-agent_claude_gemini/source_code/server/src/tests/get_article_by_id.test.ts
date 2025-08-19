import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { articlesTable } from '../db/schema';
import { type GetArticleByIdInput, type CreateArticleInput } from '../schema';
import { getArticleById } from '../handlers/get_article_by_id';

// Test data for creating articles
const testArticleData: CreateArticleInput = {
  product_name: 'Test Gaming Mouse',
  category: 'mice',
  price: 79.99,
  overall_rating: 4.5,
  short_description: 'High-performance gaming mouse with RGB lighting',
  detailed_review: 'This is a comprehensive review of the gaming mouse...',
  pros: ['Great ergonomics', 'Excellent sensor accuracy', 'Customizable RGB'],
  cons: ['Expensive', 'Software could be better'],
  main_image_url: 'https://example.com/mouse.jpg'
};

const secondArticleData: CreateArticleInput = {
  product_name: 'Mechanical Keyboard',
  category: 'keyboards',
  price: 149.99,
  overall_rating: 4.8,
  short_description: 'Premium mechanical keyboard with blue switches',
  detailed_review: 'An in-depth review of this mechanical keyboard...',
  pros: ['Tactile switches', 'Solid build quality', 'Great for typing'],
  cons: ['Loud clicks', 'No wireless option'],
  main_image_url: null
};

describe('getArticleById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return article when found', async () => {
    // Create test article
    const insertedArticles = await db.insert(articlesTable)
      .values({
        product_name: testArticleData.product_name,
        category: testArticleData.category,
        price: testArticleData.price.toString(),
        overall_rating: testArticleData.overall_rating.toString(),
        short_description: testArticleData.short_description,
        detailed_review: testArticleData.detailed_review,
        pros: testArticleData.pros,
        cons: testArticleData.cons,
        main_image_url: testArticleData.main_image_url
      })
      .returning()
      .execute();

    const articleId = insertedArticles[0].id;
    const input: GetArticleByIdInput = { id: articleId };

    const result = await getArticleById(input);

    expect(result).not.toBeNull();
    expect(result!.id).toBe(articleId);
    expect(result!.product_name).toBe('Test Gaming Mouse');
    expect(result!.category).toBe('mice');
    expect(result!.price).toBe(79.99);
    expect(typeof result!.price).toBe('number');
    expect(result!.overall_rating).toBe(4.5);
    expect(typeof result!.overall_rating).toBe('number');
    expect(result!.short_description).toBe('High-performance gaming mouse with RGB lighting');
    expect(result!.detailed_review).toBe('This is a comprehensive review of the gaming mouse...');
    expect(result!.pros).toEqual(['Great ergonomics', 'Excellent sensor accuracy', 'Customizable RGB']);
    expect(result!.cons).toEqual(['Expensive', 'Software could be better']);
    expect(result!.main_image_url).toBe('https://example.com/mouse.jpg');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when article not found', async () => {
    const input: GetArticleByIdInput = { id: 999999 };

    const result = await getArticleById(input);

    expect(result).toBeNull();
  });

  it('should handle article with null image URL', async () => {
    // Create test article with null image URL
    const insertedArticles = await db.insert(articlesTable)
      .values({
        product_name: secondArticleData.product_name,
        category: secondArticleData.category,
        price: secondArticleData.price.toString(),
        overall_rating: secondArticleData.overall_rating.toString(),
        short_description: secondArticleData.short_description,
        detailed_review: secondArticleData.detailed_review,
        pros: secondArticleData.pros,
        cons: secondArticleData.cons,
        main_image_url: secondArticleData.main_image_url
      })
      .returning()
      .execute();

    const articleId = insertedArticles[0].id;
    const input: GetArticleByIdInput = { id: articleId };

    const result = await getArticleById(input);

    expect(result).not.toBeNull();
    expect(result!.id).toBe(articleId);
    expect(result!.product_name).toBe('Mechanical Keyboard');
    expect(result!.category).toBe('keyboards');
    expect(result!.main_image_url).toBeNull();
    expect(result!.price).toBe(149.99);
    expect(typeof result!.price).toBe('number');
    expect(result!.overall_rating).toBe(4.8);
    expect(typeof result!.overall_rating).toBe('number');
  });

  it('should return the correct article when multiple articles exist', async () => {
    // Create multiple test articles
    const insertedArticles = await db.insert(articlesTable)
      .values([
        {
          product_name: testArticleData.product_name,
          category: testArticleData.category,
          price: testArticleData.price.toString(),
          overall_rating: testArticleData.overall_rating.toString(),
          short_description: testArticleData.short_description,
          detailed_review: testArticleData.detailed_review,
          pros: testArticleData.pros,
          cons: testArticleData.cons,
          main_image_url: testArticleData.main_image_url
        },
        {
          product_name: secondArticleData.product_name,
          category: secondArticleData.category,
          price: secondArticleData.price.toString(),
          overall_rating: secondArticleData.overall_rating.toString(),
          short_description: secondArticleData.short_description,
          detailed_review: secondArticleData.detailed_review,
          pros: secondArticleData.pros,
          cons: secondArticleData.cons,
          main_image_url: secondArticleData.main_image_url
        }
      ])
      .returning()
      .execute();

    const secondArticleId = insertedArticles[1].id;
    const input: GetArticleByIdInput = { id: secondArticleId };

    const result = await getArticleById(input);

    expect(result).not.toBeNull();
    expect(result!.id).toBe(secondArticleId);
    expect(result!.product_name).toBe('Mechanical Keyboard');
    expect(result!.category).toBe('keyboards');
    expect(result!.price).toBe(149.99);
    expect(result!.overall_rating).toBe(4.8);
  });

  it('should handle different product categories', async () => {
    // Create article with headsets category
    const headsetData = {
      product_name: 'Gaming Headset',
      category: 'headsets' as const,
      price: '99.99',
      overall_rating: '4.2',
      short_description: 'Immersive gaming headset with 7.1 surround sound',
      detailed_review: 'Detailed review of the gaming headset...',
      pros: ['Great sound quality', 'Comfortable padding'],
      cons: ['Heavy weight'],
      main_image_url: 'https://example.com/headset.jpg'
    };

    const insertedArticles = await db.insert(articlesTable)
      .values(headsetData)
      .returning()
      .execute();

    const articleId = insertedArticles[0].id;
    const input: GetArticleByIdInput = { id: articleId };

    const result = await getArticleById(input);

    expect(result).not.toBeNull();
    expect(result!.category).toBe('headsets');
    expect(result!.product_name).toBe('Gaming Headset');
    expect(result!.price).toBe(99.99);
    expect(result!.overall_rating).toBe(4.2);
  });
});
