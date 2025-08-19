import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { articlesTable } from '../db/schema';
import { type UpdateArticleInput, type CreateArticleInput } from '../schema';
import { updateArticle } from '../handlers/update_article';
import { eq } from 'drizzle-orm';

// Test article data
const testArticleData: CreateArticleInput = {
  product_name: 'Logitech MX Master 3',
  category: 'mice' as const,
  price: 99.99,
  overall_rating: 4.5,
  short_description: 'Premium wireless mouse',
  detailed_review: 'This is a detailed review of the Logitech MX Master 3.',
  pros: ['Excellent ergonomics', 'Great battery life'],
  cons: ['Expensive', 'Heavy'],
  main_image_url: 'https://example.com/image.jpg'
};

// Helper function to create test article
const createTestArticle = async () => {
  const result = await db.insert(articlesTable)
    .values({
      ...testArticleData,
      price: testArticleData.price.toString(),
      overall_rating: testArticleData.overall_rating.toString()
    })
    .returning()
    .execute();
  
  return result[0];
};

describe('updateArticle', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update article with all fields', async () => {
    const article = await createTestArticle();
    
    const updateInput: UpdateArticleInput = {
      id: article.id,
      product_name: 'Updated Product Name',
      category: 'keyboards',
      price: 149.99,
      overall_rating: 3.5,
      short_description: 'Updated description',
      detailed_review: 'Updated detailed review',
      pros: ['New pro 1', 'New pro 2'],
      cons: ['New con 1'],
      main_image_url: 'https://example.com/new-image.jpg'
    };

    const result = await updateArticle(updateInput);

    expect(result).toBeDefined();
    expect(result!.id).toEqual(article.id);
    expect(result!.product_name).toEqual('Updated Product Name');
    expect(result!.category).toEqual('keyboards');
    expect(result!.price).toEqual(149.99);
    expect(result!.overall_rating).toEqual(3.5);
    expect(result!.short_description).toEqual('Updated description');
    expect(result!.detailed_review).toEqual('Updated detailed review');
    expect(result!.pros).toEqual(['New pro 1', 'New pro 2']);
    expect(result!.cons).toEqual(['New con 1']);
    expect(result!.main_image_url).toEqual('https://example.com/new-image.jpg');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.updated_at.getTime()).toBeGreaterThan(result!.created_at.getTime());
  });

  it('should update article with partial fields', async () => {
    const article = await createTestArticle();
    
    const updateInput: UpdateArticleInput = {
      id: article.id,
      product_name: 'Partially Updated Name',
      price: 89.99
    };

    const result = await updateArticle(updateInput);

    expect(result).toBeDefined();
    expect(result!.id).toEqual(article.id);
    expect(result!.product_name).toEqual('Partially Updated Name');
    expect(result!.price).toEqual(89.99);
    // Unchanged fields should remain the same
    expect(result!.category).toEqual('mice');
    expect(result!.overall_rating).toEqual(4.5);
    expect(result!.short_description).toEqual(testArticleData.short_description);
    expect(result!.detailed_review).toEqual(testArticleData.detailed_review);
    expect(result!.pros).toEqual(testArticleData.pros);
    expect(result!.cons).toEqual(testArticleData.cons);
    expect(result!.main_image_url).toEqual(testArticleData.main_image_url);
  });

  it('should update main_image_url to null', async () => {
    const article = await createTestArticle();
    
    const updateInput: UpdateArticleInput = {
      id: article.id,
      main_image_url: null
    };

    const result = await updateArticle(updateInput);

    expect(result).toBeDefined();
    expect(result!.main_image_url).toBeNull();
    // Other fields should remain unchanged
    expect(result!.product_name).toEqual(testArticleData.product_name);
    expect(result!.price).toEqual(testArticleData.price);
  });

  it('should update pros and cons arrays', async () => {
    const article = await createTestArticle();
    
    const updateInput: UpdateArticleInput = {
      id: article.id,
      pros: ['Single pro'],
      cons: ['First con', 'Second con', 'Third con']
    };

    const result = await updateArticle(updateInput);

    expect(result).toBeDefined();
    expect(result!.pros).toEqual(['Single pro']);
    expect(result!.cons).toEqual(['First con', 'Second con', 'Third con']);
    // Other fields should remain unchanged
    expect(result!.product_name).toEqual(testArticleData.product_name);
    expect(result!.category).toEqual(testArticleData.category);
  });

  it('should return null for non-existent article', async () => {
    const updateInput: UpdateArticleInput = {
      id: 99999, // Non-existent ID
      product_name: 'This should not work'
    };

    const result = await updateArticle(updateInput);

    expect(result).toBeNull();
  });

  it('should persist changes to database', async () => {
    const article = await createTestArticle();
    
    // Add small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 1));
    
    const updateInput: UpdateArticleInput = {
      id: article.id,
      product_name: 'Database Persistence Test',
      overall_rating: 2.5
    };

    await updateArticle(updateInput);

    // Query database directly to verify changes
    const articles = await db.select()
      .from(articlesTable)
      .where(eq(articlesTable.id, article.id))
      .execute();

    expect(articles).toHaveLength(1);
    expect(articles[0].product_name).toEqual('Database Persistence Test');
    expect(parseFloat(articles[0].overall_rating)).toEqual(2.5);
    expect(articles[0].updated_at).toBeInstanceOf(Date);
    expect(articles[0].updated_at.getTime()).toBeGreaterThanOrEqual(articles[0].created_at.getTime());
  });

  it('should handle numeric precision correctly', async () => {
    const article = await createTestArticle();
    
    const updateInput: UpdateArticleInput = {
      id: article.id,
      price: 123.45,
      overall_rating: 4.7
    };

    const result = await updateArticle(updateInput);

    expect(result).toBeDefined();
    expect(result!.price).toEqual(123.45);
    expect(result!.overall_rating).toEqual(4.7);
    expect(typeof result!.price).toBe('number');
    expect(typeof result!.overall_rating).toBe('number');
  });

  it('should return null when no update fields provided', async () => {
    const article = await createTestArticle();
    
    const updateInput: UpdateArticleInput = {
      id: article.id
      // No update fields provided
    };

    const result = await updateArticle(updateInput);

    expect(result).toBeNull();
  });

  it('should update different product categories', async () => {
    const article = await createTestArticle();
    
    // Update to headsets category
    const updateInput1: UpdateArticleInput = {
      id: article.id,
      category: 'headsets'
    };

    const result1 = await updateArticle(updateInput1);
    expect(result1!.category).toEqual('headsets');

    // Update to keyboards category
    const updateInput2: UpdateArticleInput = {
      id: article.id,
      category: 'keyboards'
    };

    const result2 = await updateArticle(updateInput2);
    expect(result2!.category).toEqual('keyboards');
  });
});
