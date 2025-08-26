import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { reviewArticlesTable, categoriesTable } from '../db/schema';
import { type UpdateReviewArticleInput, type CreateCategoryInput } from '../schema';
import { updateReviewArticle } from '../handlers/update_review_article';
import { eq } from 'drizzle-orm';

describe('updateReviewArticle', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create a test category
  const createTestCategory = async (): Promise<number> => {
    const result = await db.insert(categoriesTable)
      .values({
        name: 'Electronics',
        description: 'Electronic devices and gadgets'
      })
      .returning()
      .execute();
    return result[0].id;
  };

  // Helper function to create a test review article
  const createTestReviewArticle = async (categoryId: number): Promise<number> => {
    const result = await db.insert(reviewArticlesTable)
      .values({
        title: 'Original iPhone Review',
        category_id: categoryId,
        brand: 'Apple',
        model: 'iPhone 14',
        star_rating: '4.5',
        pros: 'Great camera, excellent build quality',
        cons: 'Expensive, limited storage options',
        main_image_url: 'https://example.com/iphone.jpg',
        review_content: 'This is a comprehensive review of the iPhone 14.',
        published_at: new Date('2024-01-01')
      })
      .returning()
      .execute();
    return result[0].id;
  };

  it('should update a review article with all fields', async () => {
    const categoryId = await createTestCategory();
    const articleId = await createTestReviewArticle(categoryId);

    // Create another category for testing category_id update
    const newCategoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Smartphones',
        description: 'Mobile phones and accessories'
      })
      .returning()
      .execute();
    const newCategoryId = newCategoryResult[0].id;

    const updateInput: UpdateReviewArticleInput = {
      id: articleId,
      title: 'Updated iPhone Review',
      category_id: newCategoryId,
      brand: 'Apple Inc.',
      model: 'iPhone 15',
      star_rating: 4.8,
      pros: 'Amazing camera, premium build, fast performance',
      cons: 'High price, no charger included',
      main_image_url: 'https://example.com/iphone15.jpg',
      review_content: 'This is an updated comprehensive review of the iPhone 15.',
      published_at: new Date('2024-02-01')
    };

    const result = await updateReviewArticle(updateInput);

    // Verify all fields were updated
    expect(result.id).toEqual(articleId);
    expect(result.title).toEqual('Updated iPhone Review');
    expect(result.category_id).toEqual(newCategoryId);
    expect(result.brand).toEqual('Apple Inc.');
    expect(result.model).toEqual('iPhone 15');
    expect(result.star_rating).toEqual(4.8);
    expect(typeof result.star_rating).toBe('number');
    expect(result.pros).toEqual('Amazing camera, premium build, fast performance');
    expect(result.cons).toEqual('High price, no charger included');
    expect(result.main_image_url).toEqual('https://example.com/iphone15.jpg');
    expect(result.review_content).toEqual('This is an updated comprehensive review of the iPhone 15.');
    expect(result.published_at).toEqual(new Date('2024-02-01'));
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update only specified fields (partial update)', async () => {
    const categoryId = await createTestCategory();
    const articleId = await createTestReviewArticle(categoryId);

    // Get original article for comparison
    const originalArticle = await db.select()
      .from(reviewArticlesTable)
      .where(eq(reviewArticlesTable.id, articleId))
      .execute();
    const original = originalArticle[0];

    const updateInput: UpdateReviewArticleInput = {
      id: articleId,
      title: 'Partially Updated iPhone Review',
      star_rating: 4.7
    };

    const result = await updateReviewArticle(updateInput);

    // Verify only specified fields were updated
    expect(result.title).toEqual('Partially Updated iPhone Review');
    expect(result.star_rating).toEqual(4.7);
    expect(typeof result.star_rating).toBe('number');
    
    // Verify other fields remained unchanged
    expect(result.category_id).toEqual(original.category_id);
    expect(result.brand).toEqual(original.brand);
    expect(result.model).toEqual(original.model);
    expect(result.pros).toEqual(original.pros);
    expect(result.cons).toEqual(original.cons);
    expect(result.main_image_url).toEqual(original.main_image_url);
    expect(result.review_content).toEqual(original.review_content);
    expect(result.published_at).toEqual(original.published_at);
    
    // Verify updated_at was changed
    expect(result.updated_at.getTime()).toBeGreaterThan(original.updated_at.getTime());
    
    // Verify created_at remained unchanged
    expect(result.created_at).toEqual(original.created_at);
  });

  it('should update main_image_url to null', async () => {
    const categoryId = await createTestCategory();
    const articleId = await createTestReviewArticle(categoryId);

    const updateInput: UpdateReviewArticleInput = {
      id: articleId,
      main_image_url: null
    };

    const result = await updateReviewArticle(updateInput);

    expect(result.main_image_url).toBeNull();
  });

  it('should save updated article to database', async () => {
    const categoryId = await createTestCategory();
    const articleId = await createTestReviewArticle(categoryId);

    const updateInput: UpdateReviewArticleInput = {
      id: articleId,
      title: 'Database Test Review',
      star_rating: 3.5
    };

    await updateReviewArticle(updateInput);

    // Query database to verify update
    const articles = await db.select()
      .from(reviewArticlesTable)
      .where(eq(reviewArticlesTable.id, articleId))
      .execute();

    expect(articles).toHaveLength(1);
    const savedArticle = articles[0];
    expect(savedArticle.title).toEqual('Database Test Review');
    expect(parseFloat(savedArticle.star_rating)).toEqual(3.5);
    expect(savedArticle.updated_at).toBeInstanceOf(Date);
  });

  it('should throw error when review article does not exist', async () => {
    const nonExistentId = 99999;
    
    const updateInput: UpdateReviewArticleInput = {
      id: nonExistentId,
      title: 'This should fail'
    };

    await expect(updateReviewArticle(updateInput)).rejects.toThrow(
      /Review article with id 99999 not found/i
    );
  });

  it('should throw error when category_id does not exist', async () => {
    const categoryId = await createTestCategory();
    const articleId = await createTestReviewArticle(categoryId);
    const nonExistentCategoryId = 99999;

    const updateInput: UpdateReviewArticleInput = {
      id: articleId,
      category_id: nonExistentCategoryId
    };

    await expect(updateReviewArticle(updateInput)).rejects.toThrow(
      /Category with id 99999 not found/i
    );
  });

  it('should handle edge case star ratings', async () => {
    const categoryId = await createTestCategory();
    const articleId = await createTestReviewArticle(categoryId);

    // Test minimum rating
    let updateInput: UpdateReviewArticleInput = {
      id: articleId,
      star_rating: 1.0
    };

    let result = await updateReviewArticle(updateInput);
    expect(result.star_rating).toEqual(1.0);

    // Test maximum rating
    updateInput = {
      id: articleId,
      star_rating: 5.0
    };

    result = await updateReviewArticle(updateInput);
    expect(result.star_rating).toEqual(5.0);

    // Test decimal rating
    updateInput = {
      id: articleId,
      star_rating: 3.7
    };

    result = await updateReviewArticle(updateInput);
    expect(result.star_rating).toEqual(3.7);
  });

  it('should preserve original created_at timestamp', async () => {
    const categoryId = await createTestCategory();
    const articleId = await createTestReviewArticle(categoryId);

    // Get original created_at
    const originalArticle = await db.select()
      .from(reviewArticlesTable)
      .where(eq(reviewArticlesTable.id, articleId))
      .execute();
    const originalCreatedAt = originalArticle[0].created_at;

    // Wait a bit to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    const updateInput: UpdateReviewArticleInput = {
      id: articleId,
      title: 'Timestamp Test Review'
    };

    const result = await updateReviewArticle(updateInput);

    // Verify created_at is preserved and updated_at is newer
    expect(result.created_at).toEqual(originalCreatedAt);
    expect(result.updated_at.getTime()).toBeGreaterThan(originalCreatedAt.getTime());
  });
});
