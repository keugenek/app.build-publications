import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable, reviewArticlesTable } from '../db/schema';
import { type GetReviewArticleByIdQuery } from '../schema';
import { getReviewArticleById } from '../handlers/get_review_article_by_id';

describe('getReviewArticleById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return review article with category when found', async () => {
    // Create test category first
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Electronics',
        description: 'Electronic devices and gadgets'
      })
      .returning()
      .execute();

    const category = categoryResult[0];

    // Create test review article
    const publishedDate = new Date('2024-01-15T10:30:00Z');
    const articleResult = await db.insert(reviewArticlesTable)
      .values({
        title: 'Test Review Article',
        category_id: category.id,
        brand: 'TestBrand',
        model: 'TestModel',
        star_rating: '4.5', // Store as string for numeric column
        pros: 'Great features and performance',
        cons: 'A bit expensive',
        main_image_url: 'https://example.com/image.jpg',
        review_content: 'This is a comprehensive review of the product...',
        published_at: publishedDate
      })
      .returning()
      .execute();

    const article = articleResult[0];

    // Test the handler
    const query: GetReviewArticleByIdQuery = { id: article.id };
    const result = await getReviewArticleById(query);

    // Verify the result structure
    expect(result).toBeTruthy();
    expect(result!.id).toEqual(article.id);
    expect(result!.title).toEqual('Test Review Article');
    expect(result!.category_id).toEqual(category.id);
    expect(result!.brand).toEqual('TestBrand');
    expect(result!.model).toEqual('TestModel');
    expect(result!.star_rating).toEqual(4.5); // Should be converted to number
    expect(typeof result!.star_rating).toBe('number');
    expect(result!.pros).toEqual('Great features and performance');
    expect(result!.cons).toEqual('A bit expensive');
    expect(result!.main_image_url).toEqual('https://example.com/image.jpg');
    expect(result!.review_content).toEqual('This is a comprehensive review of the product...');
    expect(result!.published_at).toEqual(publishedDate);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);

    // Verify category information is included
    expect(result!.category).toBeTruthy();
    expect(result!.category.name).toEqual('Electronics');
    expect(result!.category.description).toEqual('Electronic devices and gadgets');
  });

  it('should return null when article does not exist', async () => {
    const query: GetReviewArticleByIdQuery = { id: 999 };
    const result = await getReviewArticleById(query);

    expect(result).toBeNull();
  });

  it('should handle article with null values correctly', async () => {
    // Create test category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Books',
        description: null // Test null description
      })
      .returning()
      .execute();

    const category = categoryResult[0];

    // Create review article with null main_image_url
    const articleResult = await db.insert(reviewArticlesTable)
      .values({
        title: 'Book Review',
        category_id: category.id,
        brand: 'Publisher',
        model: 'First Edition',
        star_rating: '3.0',
        pros: 'Good storyline',
        cons: 'Slow pacing',
        main_image_url: null, // Test null image URL
        review_content: 'A detailed book review...'
      })
      .returning()
      .execute();

    const article = articleResult[0];

    // Test the handler
    const query: GetReviewArticleByIdQuery = { id: article.id };
    const result = await getReviewArticleById(query);

    // Verify null values are handled correctly
    expect(result).toBeTruthy();
    expect(result!.main_image_url).toBeNull();
    expect(result!.category.description).toBeNull();
    expect(result!.star_rating).toEqual(3.0); // Numeric conversion still works
  });

  it('should handle different star ratings correctly', async () => {
    // Create test category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Sports',
        description: 'Sports equipment'
      })
      .returning()
      .execute();

    const category = categoryResult[0];

    // Test different rating values
    const ratings = ['1.0', '2.5', '4.8', '5.0'];
    const expectedRatings = [1.0, 2.5, 4.8, 5.0];

    for (let i = 0; i < ratings.length; i++) {
      // Create review article with specific rating
      const articleResult = await db.insert(reviewArticlesTable)
        .values({
          title: `Product Review ${i + 1}`,
          category_id: category.id,
          brand: 'SportsBrand',
          model: `Model${i + 1}`,
          star_rating: ratings[i],
          pros: 'Good quality',
          cons: 'Could be better',
          main_image_url: null,
          review_content: `Review content ${i + 1}`
        })
        .returning()
        .execute();

      const article = articleResult[0];

      // Test the handler
      const query: GetReviewArticleByIdQuery = { id: article.id };
      const result = await getReviewArticleById(query);

      // Verify rating conversion
      expect(result).toBeTruthy();
      expect(result!.star_rating).toEqual(expectedRatings[i]);
      expect(typeof result!.star_rating).toBe('number');
    }
  });

  it('should include proper timestamps', async () => {
    // Create test data
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Tech',
        description: 'Technology products'
      })
      .returning()
      .execute();

    const category = categoryResult[0];

    const customPublishedDate = new Date('2023-12-01T08:00:00Z');
    const articleResult = await db.insert(reviewArticlesTable)
      .values({
        title: 'Tech Review',
        category_id: category.id,
        brand: 'TechCorp',
        model: 'Model2024',
        star_rating: '4.0',
        pros: 'Innovative features',
        cons: 'Battery life',
        main_image_url: 'https://example.com/tech.jpg',
        review_content: 'Detailed tech review...',
        published_at: customPublishedDate
      })
      .returning()
      .execute();

    const article = articleResult[0];

    // Test the handler
    const query: GetReviewArticleByIdQuery = { id: article.id };
    const result = await getReviewArticleById(query);

    // Verify timestamp handling
    expect(result).toBeTruthy();
    expect(result!.published_at).toEqual(customPublishedDate);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
    
    // created_at and updated_at should be recent (within last few seconds)
    const now = new Date();
    const timeDiff = now.getTime() - result!.created_at.getTime();
    expect(timeDiff).toBeLessThan(5000); // Less than 5 seconds ago
  });
});
