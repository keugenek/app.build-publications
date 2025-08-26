import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable, reviewArticlesTable } from '../db/schema';
import { type DeleteReviewArticleInput } from '../schema';
import { deleteReviewArticle } from '../handlers/delete_review_article';
import { eq } from 'drizzle-orm';

describe('deleteReviewArticle', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing review article', async () => {
    // Create a category first (required for foreign key)
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        description: 'A test category'
      })
      .returning()
      .execute();

    const categoryId = categoryResult[0].id;

    // Create a review article
    const articleResult = await db.insert(reviewArticlesTable)
      .values({
        title: 'Test Review Article',
        category_id: categoryId,
        brand: 'Test Brand',
        model: 'Test Model',
        star_rating: '4.5',
        pros: 'Great product',
        cons: 'Could be better',
        main_image_url: 'https://example.com/image.jpg',
        review_content: 'This is a detailed review of the product.',
        published_at: new Date()
      })
      .returning()
      .execute();

    const articleId = articleResult[0].id;

    // Delete the review article
    const deleteInput: DeleteReviewArticleInput = { id: articleId };
    const result = await deleteReviewArticle(deleteInput);

    // Verify deletion was successful
    expect(result.success).toBe(true);

    // Verify the article no longer exists in the database
    const deletedArticle = await db.select()
      .from(reviewArticlesTable)
      .where(eq(reviewArticlesTable.id, articleId))
      .execute();

    expect(deletedArticle).toHaveLength(0);
  });

  it('should throw error when trying to delete non-existent review article', async () => {
    const nonExistentId = 99999;
    const deleteInput: DeleteReviewArticleInput = { id: nonExistentId };

    await expect(deleteReviewArticle(deleteInput))
      .rejects
      .toThrow(/Review article with id 99999 not found/i);
  });

  it('should not affect other review articles when deleting one', async () => {
    // Create a category first
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        description: 'A test category'
      })
      .returning()
      .execute();

    const categoryId = categoryResult[0].id;

    // Create two review articles
    const article1Result = await db.insert(reviewArticlesTable)
      .values({
        title: 'First Review Article',
        category_id: categoryId,
        brand: 'Brand A',
        model: 'Model A',
        star_rating: '4.0',
        pros: 'Good features',
        cons: 'Some issues',
        main_image_url: null,
        review_content: 'First review content.',
        published_at: new Date()
      })
      .returning()
      .execute();

    const article2Result = await db.insert(reviewArticlesTable)
      .values({
        title: 'Second Review Article',
        category_id: categoryId,
        brand: 'Brand B',
        model: 'Model B',
        star_rating: '5.0',
        pros: 'Excellent product',
        cons: 'None',
        main_image_url: 'https://example.com/image2.jpg',
        review_content: 'Second review content.',
        published_at: new Date()
      })
      .returning()
      .execute();

    const article1Id = article1Result[0].id;
    const article2Id = article2Result[0].id;

    // Delete only the first article
    const deleteInput: DeleteReviewArticleInput = { id: article1Id };
    const result = await deleteReviewArticle(deleteInput);

    expect(result.success).toBe(true);

    // Verify first article is deleted
    const deletedArticle = await db.select()
      .from(reviewArticlesTable)
      .where(eq(reviewArticlesTable.id, article1Id))
      .execute();

    expect(deletedArticle).toHaveLength(0);

    // Verify second article still exists
    const remainingArticle = await db.select()
      .from(reviewArticlesTable)
      .where(eq(reviewArticlesTable.id, article2Id))
      .execute();

    expect(remainingArticle).toHaveLength(1);
    expect(remainingArticle[0].title).toEqual('Second Review Article');
    expect(remainingArticle[0].brand).toEqual('Brand B');
  });

  it('should handle database constraints properly', async () => {
    // Create a category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        description: 'A test category'
      })
      .returning()
      .execute();

    const categoryId = categoryResult[0].id;

    // Create a review article
    const articleResult = await db.insert(reviewArticlesTable)
      .values({
        title: 'Test Review Article',
        category_id: categoryId,
        brand: 'Test Brand',
        model: 'Test Model',
        star_rating: '3.5',
        pros: 'Good value',
        cons: 'Limited features',
        main_image_url: null,
        review_content: 'A comprehensive review.',
        published_at: new Date()
      })
      .returning()
      .execute();

    const articleId = articleResult[0].id;

    // Delete the article
    const deleteInput: DeleteReviewArticleInput = { id: articleId };
    const result = await deleteReviewArticle(deleteInput);

    expect(result.success).toBe(true);

    // Verify article is completely removed
    const allArticles = await db.select()
      .from(reviewArticlesTable)
      .execute();

    expect(allArticles).toHaveLength(0);

    // Verify category still exists (should not be affected by article deletion)
    const categories = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, categoryId))
      .execute();

    expect(categories).toHaveLength(1);
    expect(categories[0].name).toEqual('Test Category');
  });
});
