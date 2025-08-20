import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { reviewArticlesTable } from '../db/schema';
import { type CreateReviewArticleInput } from '../schema';
import { deleteReviewArticle } from '../handlers/delete_review_article';
import { eq } from 'drizzle-orm';

// Test data for creating review articles
const testReviewInput: CreateReviewArticleInput = {
  product_name: 'Gaming Mouse X1',
  brand: 'TechBrand',
  category: 'mice',
  star_rating: 4,
  price_range: '25_50',
  pros: ['Great accuracy', 'Comfortable grip', 'Good value'],
  cons: ['Cable could be longer', 'RGB lighting is basic'],
  review_body: 'This gaming mouse offers excellent performance for its price point. The sensor accuracy is impressive and it feels comfortable during extended gaming sessions.',
  published: true
};

const createTestReview = async (input = testReviewInput) => {
  // Generate a unique slug for testing
  const slug = `${input.product_name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
  
  const result = await db
    .insert(reviewArticlesTable)
    .values({
      ...input,
      slug,
      pros: JSON.stringify(input.pros),
      cons: JSON.stringify(input.cons)
    })
    .returning()
    .execute();

  return result[0];
};

describe('deleteReviewArticle', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing review article', async () => {
    // Create a test review article
    const createdReview = await createTestReview();
    
    // Delete the review article
    const result = await deleteReviewArticle(createdReview.id);
    
    // Verify deletion was successful
    expect(result).toBe(true);
  });

  it('should remove article from database after deletion', async () => {
    // Create a test review article
    const createdReview = await createTestReview();
    
    // Verify the article exists before deletion
    const beforeDeletion = await db
      .select()
      .from(reviewArticlesTable)
      .where(eq(reviewArticlesTable.id, createdReview.id))
      .execute();
    
    expect(beforeDeletion).toHaveLength(1);
    
    // Delete the review article
    await deleteReviewArticle(createdReview.id);
    
    // Verify the article no longer exists
    const afterDeletion = await db
      .select()
      .from(reviewArticlesTable)
      .where(eq(reviewArticlesTable.id, createdReview.id))
      .execute();
    
    expect(afterDeletion).toHaveLength(0);
  });

  it('should return false when trying to delete non-existent article', async () => {
    // Try to delete an article with an ID that doesn't exist
    const result = await deleteReviewArticle(99999);
    
    // Should return false since no article was deleted
    expect(result).toBe(false);
  });

  it('should not affect other articles when deleting one', async () => {
    // Create two test review articles
    const review1 = await createTestReview({
      ...testReviewInput,
      product_name: 'Gaming Mouse A'
    });
    
    const review2 = await createTestReview({
      ...testReviewInput,
      product_name: 'Gaming Mouse B',
      brand: 'AnotherBrand'
    });
    
    // Delete the first review
    const result = await deleteReviewArticle(review1.id);
    expect(result).toBe(true);
    
    // Verify the first review is deleted
    const deletedReview = await db
      .select()
      .from(reviewArticlesTable)
      .where(eq(reviewArticlesTable.id, review1.id))
      .execute();
    
    expect(deletedReview).toHaveLength(0);
    
    // Verify the second review still exists
    const remainingReview = await db
      .select()
      .from(reviewArticlesTable)
      .where(eq(reviewArticlesTable.id, review2.id))
      .execute();
    
    expect(remainingReview).toHaveLength(1);
    expect(remainingReview[0].product_name).toBe('Gaming Mouse B');
  });

  it('should handle deletion with different review data types', async () => {
    // Create a review with different characteristics
    const unpublishedReview = await createTestReview({
      ...testReviewInput,
      product_name: 'Mechanical Keyboard Pro',
      brand: 'KeyboardCorp',
      category: 'keyboards',
      star_rating: 5,
      price_range: '100_plus',
      pros: ['Excellent build quality', 'Perfect tactile feedback'],
      cons: ['Expensive', 'Loud clicks'],
      published: false
    });
    
    // Delete the unpublished review
    const result = await deleteReviewArticle(unpublishedReview.id);
    
    expect(result).toBe(true);
    
    // Verify deletion
    const deletedReview = await db
      .select()
      .from(reviewArticlesTable)
      .where(eq(reviewArticlesTable.id, unpublishedReview.id))
      .execute();
    
    expect(deletedReview).toHaveLength(0);
  });
});
