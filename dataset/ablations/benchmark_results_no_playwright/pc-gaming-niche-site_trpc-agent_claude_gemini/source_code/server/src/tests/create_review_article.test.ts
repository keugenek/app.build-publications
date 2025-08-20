import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable, reviewArticlesTable } from '../db/schema';
import { type CreateReviewArticleInput } from '../schema';
import { createReviewArticle } from '../handlers/create_review_article';
import { eq } from 'drizzle-orm';

// Test category to use for review articles
const testCategory = {
  name: 'Electronics',
  description: 'Electronic devices and gadgets'
};

// Test input for creating review articles
const testInput: CreateReviewArticleInput = {
  title: 'Best Wireless Headphones 2024',
  category_id: 0, // Will be set after creating category
  brand: 'Sony',
  model: 'WH-1000XM5',
  star_rating: 4.5,
  pros: 'Excellent noise cancellation, great battery life, comfortable fit',
  cons: 'Expensive, plastic build quality could be better',
  main_image_url: 'https://example.com/headphones.jpg',
  review_content: 'These headphones offer exceptional sound quality and industry-leading noise cancellation...'
};

describe('createReviewArticle', () => {
  let categoryId: number;

  beforeEach(async () => {
    await createDB();
    
    // Create test category
    const categoryResult = await db.insert(categoriesTable)
      .values(testCategory)
      .returning()
      .execute();
    
    categoryId = categoryResult[0].id;
  });

  afterEach(resetDB);

  it('should create a review article with all fields', async () => {
    const input = { ...testInput, category_id: categoryId };
    const result = await createReviewArticle(input);

    // Verify all fields are correctly set
    expect(result.title).toEqual('Best Wireless Headphones 2024');
    expect(result.category_id).toEqual(categoryId);
    expect(result.brand).toEqual('Sony');
    expect(result.model).toEqual('WH-1000XM5');
    expect(result.star_rating).toEqual(4.5);
    expect(typeof result.star_rating).toBe('number');
    expect(result.pros).toEqual(testInput.pros);
    expect(result.cons).toEqual(testInput.cons);
    expect(result.main_image_url).toEqual('https://example.com/headphones.jpg');
    expect(result.review_content).toEqual(testInput.review_content);
    expect(result.id).toBeDefined();
    expect(result.published_at).toBeInstanceOf(Date);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save review article to database', async () => {
    const input = { ...testInput, category_id: categoryId };
    const result = await createReviewArticle(input);

    // Query the database to verify the review article was saved
    const reviewArticles = await db.select()
      .from(reviewArticlesTable)
      .where(eq(reviewArticlesTable.id, result.id))
      .execute();

    expect(reviewArticles).toHaveLength(1);
    const savedArticle = reviewArticles[0];
    
    expect(savedArticle.title).toEqual('Best Wireless Headphones 2024');
    expect(savedArticle.category_id).toEqual(categoryId);
    expect(savedArticle.brand).toEqual('Sony');
    expect(savedArticle.model).toEqual('WH-1000XM5');
    expect(parseFloat(savedArticle.star_rating)).toEqual(4.5);
    expect(savedArticle.pros).toEqual(testInput.pros);
    expect(savedArticle.cons).toEqual(testInput.cons);
    expect(savedArticle.main_image_url).toEqual('https://example.com/headphones.jpg');
    expect(savedArticle.review_content).toEqual(testInput.review_content);
    expect(savedArticle.published_at).toBeInstanceOf(Date);
    expect(savedArticle.created_at).toBeInstanceOf(Date);
    expect(savedArticle.updated_at).toBeInstanceOf(Date);
  });

  it('should set published_at to now when not provided', async () => {
    const inputWithoutDate = { ...testInput, category_id: categoryId };
    delete inputWithoutDate.published_at;

    const beforeCreate = new Date();
    const result = await createReviewArticle(inputWithoutDate);
    const afterCreate = new Date();

    expect(result.published_at).toBeInstanceOf(Date);
    expect(result.published_at >= beforeCreate).toBe(true);
    expect(result.published_at <= afterCreate).toBe(true);
  });

  it('should use provided published_at date', async () => {
    const customDate = new Date('2024-01-15T10:30:00Z');
    const input = { ...testInput, category_id: categoryId, published_at: customDate };
    
    const result = await createReviewArticle(input);

    expect(result.published_at).toEqual(customDate);
  });

  it('should set created_at and updated_at to the same time for new records', async () => {
    const input = { ...testInput, category_id: categoryId };
    const result = await createReviewArticle(input);

    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(Math.abs(result.created_at.getTime() - result.updated_at.getTime())).toBeLessThan(1000);
  });

  it('should handle null main_image_url', async () => {
    const input = { ...testInput, category_id: categoryId, main_image_url: null };
    const result = await createReviewArticle(input);

    expect(result.main_image_url).toBeNull();

    // Verify in database
    const savedArticles = await db.select()
      .from(reviewArticlesTable)
      .where(eq(reviewArticlesTable.id, result.id))
      .execute();

    expect(savedArticles[0].main_image_url).toBeNull();
  });

  it('should handle integer star ratings', async () => {
    const input = { ...testInput, category_id: categoryId, star_rating: 5 };
    const result = await createReviewArticle(input);

    expect(result.star_rating).toEqual(5);
    expect(typeof result.star_rating).toBe('number');
  });

  it('should throw error when category does not exist', async () => {
    const input = { ...testInput, category_id: 999999 }; // Non-existent category ID
    
    await expect(createReviewArticle(input)).rejects.toThrow(/Category with id 999999 does not exist/i);
  });

  it('should throw error when category_id is 0', async () => {
    const input = { ...testInput, category_id: 0 }; // Invalid category ID
    
    await expect(createReviewArticle(input)).rejects.toThrow(/Category with id 0 does not exist/i);
  });
});
