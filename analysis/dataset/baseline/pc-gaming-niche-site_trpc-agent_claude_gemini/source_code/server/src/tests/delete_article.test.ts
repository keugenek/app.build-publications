import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { articlesTable } from '../db/schema';
import { type DeleteArticleInput, type CreateArticleInput } from '../schema';
import { deleteArticle } from '../handlers/delete_article';
import { eq } from 'drizzle-orm';

// Test input for creating articles to delete
const testCreateInput: CreateArticleInput = {
  product_name: 'Test Gaming Mouse',
  category: 'mice',
  price: 99.99,
  overall_rating: 4.5,
  short_description: 'A great gaming mouse for testing',
  detailed_review: 'This is a detailed review of the test gaming mouse with all the features.',
  pros: ['Great sensor', 'Comfortable grip', 'Good value'],
  cons: ['Heavy weight', 'Limited customization'],
  main_image_url: 'https://example.com/mouse.jpg'
};

describe('deleteArticle', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing article successfully', async () => {
    // Create an article first
    const createResult = await db.insert(articlesTable)
      .values({
        product_name: testCreateInput.product_name,
        category: testCreateInput.category,
        price: testCreateInput.price.toString(),
        overall_rating: testCreateInput.overall_rating.toString(),
        short_description: testCreateInput.short_description,
        detailed_review: testCreateInput.detailed_review,
        pros: testCreateInput.pros,
        cons: testCreateInput.cons,
        main_image_url: testCreateInput.main_image_url
      })
      .returning()
      .execute();

    const createdArticle = createResult[0];

    // Delete the article
    const deleteInput: DeleteArticleInput = { id: createdArticle.id };
    const result = await deleteArticle(deleteInput);

    // Should return true (successful deletion)
    expect(result).toBe(true);

    // Verify the article no longer exists in database
    const articles = await db.select()
      .from(articlesTable)
      .where(eq(articlesTable.id, createdArticle.id))
      .execute();

    expect(articles).toHaveLength(0);
  });

  it('should return false when trying to delete non-existent article', async () => {
    const deleteInput: DeleteArticleInput = { id: 999999 }; // Non-existent ID
    const result = await deleteArticle(deleteInput);

    // Should return false (nothing to delete)
    expect(result).toBe(false);
  });

  it('should not affect other articles when deleting one article', async () => {
    // Create multiple articles
    const article1Result = await db.insert(articlesTable)
      .values({
        product_name: 'Gaming Mouse 1',
        category: 'mice',
        price: '99.99',
        overall_rating: '4.5',
        short_description: 'First mouse',
        detailed_review: 'Detailed review 1',
        pros: ['Pro 1'],
        cons: ['Con 1'],
        main_image_url: 'https://example.com/mouse1.jpg'
      })
      .returning()
      .execute();

    const article2Result = await db.insert(articlesTable)
      .values({
        product_name: 'Gaming Keyboard 1',
        category: 'keyboards',
        price: '149.99',
        overall_rating: '4.0',
        short_description: 'First keyboard',
        detailed_review: 'Detailed review 2',
        pros: ['Pro 2'],
        cons: ['Con 2'],
        main_image_url: 'https://example.com/keyboard1.jpg'
      })
      .returning()
      .execute();

    // Delete only the first article
    const deleteInput: DeleteArticleInput = { id: article1Result[0].id };
    const result = await deleteArticle(deleteInput);

    expect(result).toBe(true);

    // Verify first article is deleted
    const deletedArticle = await db.select()
      .from(articlesTable)
      .where(eq(articlesTable.id, article1Result[0].id))
      .execute();

    expect(deletedArticle).toHaveLength(0);

    // Verify second article still exists
    const remainingArticle = await db.select()
      .from(articlesTable)
      .where(eq(articlesTable.id, article2Result[0].id))
      .execute();

    expect(remainingArticle).toHaveLength(1);
    expect(remainingArticle[0].product_name).toBe('Gaming Keyboard 1');
  });

  it('should handle deletion of articles with different categories', async () => {
    // Create articles in different categories
    const mouseResult = await db.insert(articlesTable)
      .values({
        product_name: 'Test Mouse',
        category: 'mice',
        price: '79.99',
        overall_rating: '4.2',
        short_description: 'Test mouse description',
        detailed_review: 'Test mouse review',
        pros: ['Mouse pro'],
        cons: ['Mouse con'],
        main_image_url: null
      })
      .returning()
      .execute();

    const keyboardResult = await db.insert(articlesTable)
      .values({
        product_name: 'Test Keyboard',
        category: 'keyboards',
        price: '129.99',
        overall_rating: '4.8',
        short_description: 'Test keyboard description',
        detailed_review: 'Test keyboard review',
        pros: ['Keyboard pro'],
        cons: ['Keyboard con'],
        main_image_url: null
      })
      .returning()
      .execute();

    const headsetResult = await db.insert(articlesTable)
      .values({
        product_name: 'Test Headset',
        category: 'headsets',
        price: '199.99',
        overall_rating: '4.6',
        short_description: 'Test headset description',
        detailed_review: 'Test headset review',
        pros: ['Headset pro'],
        cons: ['Headset con'],
        main_image_url: 'https://example.com/headset.jpg'
      })
      .returning()
      .execute();

    // Delete keyboard article
    const deleteInput: DeleteArticleInput = { id: keyboardResult[0].id };
    const result = await deleteArticle(deleteInput);

    expect(result).toBe(true);

    // Verify only keyboard was deleted
    const allArticles = await db.select()
      .from(articlesTable)
      .execute();

    expect(allArticles).toHaveLength(2);
    expect(allArticles.find(a => a.id === mouseResult[0].id)).toBeDefined();
    expect(allArticles.find(a => a.id === headsetResult[0].id)).toBeDefined();
    expect(allArticles.find(a => a.id === keyboardResult[0].id)).toBeUndefined();
  });
});
