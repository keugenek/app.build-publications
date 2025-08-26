import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productReviewsTable } from '../db/schema';
import { type DeleteReviewInput, type CreateProductReviewInput } from '../schema';
import { deleteProductReview } from '../handlers/delete_product_review';
import { eq } from 'drizzle-orm';

// Test input for creating a review to delete
const testReviewInput: CreateProductReviewInput = {
  product_name: 'Test Gaming Mouse',
  brand: 'TestBrand',
  category: 'mice',
  rating: 8.5,
  pros: ['Great accuracy', 'Comfortable grip'],
  cons: ['Expensive', 'Heavy cable'],
  review_text: 'This is a comprehensive test review for a gaming mouse with detailed analysis.',
  image_urls: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
  is_published: true
};

describe('deleteProductReview', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing product review', async () => {
    // First, create a review to delete
    const insertResult = await db.insert(productReviewsTable)
      .values({
        product_name: testReviewInput.product_name,
        brand: testReviewInput.brand,
        category: testReviewInput.category,
        rating: testReviewInput.rating,
        pros: testReviewInput.pros,
        cons: testReviewInput.cons,
        review_text: testReviewInput.review_text,
        image_urls: testReviewInput.image_urls,
        is_published: testReviewInput.is_published
      })
      .returning()
      .execute();

    const createdReview = insertResult[0];
    const deleteInput: DeleteReviewInput = { id: createdReview.id };

    // Delete the review
    const result = await deleteProductReview(deleteInput);

    // Verify return value
    expect(result.success).toBe(true);
    expect(result.id).toEqual(createdReview.id);
  });

  it('should remove review from database', async () => {
    // Create a review to delete
    const insertResult = await db.insert(productReviewsTable)
      .values({
        product_name: testReviewInput.product_name,
        brand: testReviewInput.brand,
        category: testReviewInput.category,
        rating: testReviewInput.rating,
        pros: testReviewInput.pros,
        cons: testReviewInput.cons,
        review_text: testReviewInput.review_text,
        image_urls: testReviewInput.image_urls,
        is_published: testReviewInput.is_published
      })
      .returning()
      .execute();

    const createdReview = insertResult[0];
    const deleteInput: DeleteReviewInput = { id: createdReview.id };

    // Delete the review
    await deleteProductReview(deleteInput);

    // Verify the review is actually deleted from database
    const reviews = await db.select()
      .from(productReviewsTable)
      .where(eq(productReviewsTable.id, createdReview.id))
      .execute();

    expect(reviews).toHaveLength(0);
  });

  it('should throw error when review does not exist', async () => {
    const nonExistentId = 99999;
    const deleteInput: DeleteReviewInput = { id: nonExistentId };

    // Attempt to delete non-existent review
    await expect(deleteProductReview(deleteInput))
      .rejects.toThrow(/not found/i);
  });

  it('should not affect other reviews when deleting one', async () => {
    // Create multiple reviews
    const review1Result = await db.insert(productReviewsTable)
      .values({
        product_name: 'Review 1 Product',
        brand: 'Brand1',
        category: 'mice',
        rating: 7.5,
        pros: ['Pro 1'],
        cons: ['Con 1'],
        review_text: 'This is review 1 with sufficient length for validation.',
        image_urls: [],
        is_published: true
      })
      .returning()
      .execute();

    const review2Result = await db.insert(productReviewsTable)
      .values({
        product_name: 'Review 2 Product',
        brand: 'Brand2',
        category: 'keyboards',
        rating: 9.0,
        pros: ['Pro 2'],
        cons: ['Con 2'],
        review_text: 'This is review 2 with sufficient length for validation.',
        image_urls: [],
        is_published: false
      })
      .returning()
      .execute();

    const review1 = review1Result[0];
    const review2 = review2Result[0];

    // Delete only the first review
    await deleteProductReview({ id: review1.id });

    // Verify first review is deleted
    const deletedReviews = await db.select()
      .from(productReviewsTable)
      .where(eq(productReviewsTable.id, review1.id))
      .execute();
    expect(deletedReviews).toHaveLength(0);

    // Verify second review still exists
    const remainingReviews = await db.select()
      .from(productReviewsTable)
      .where(eq(productReviewsTable.id, review2.id))
      .execute();
    expect(remainingReviews).toHaveLength(1);
    expect(remainingReviews[0].product_name).toEqual('Review 2 Product');
  });

  it('should handle deletion with different review categories', async () => {
    // Create review with different category
    const insertResult = await db.insert(productReviewsTable)
      .values({
        product_name: 'Gaming Headset',
        brand: 'AudioBrand',
        category: 'headsets',
        rating: 6.8,
        pros: ['Good sound quality'],
        cons: ['Uncomfortable for long sessions'],
        review_text: 'This headset provides decent audio quality but comfort could be improved.',
        image_urls: ['https://example.com/headset.jpg'],
        is_published: false
      })
      .returning()
      .execute();

    const createdReview = insertResult[0];

    // Delete the review
    const result = await deleteProductReview({ id: createdReview.id });

    // Verify successful deletion
    expect(result.success).toBe(true);
    expect(result.id).toEqual(createdReview.id);

    // Verify removal from database
    const reviews = await db.select()
      .from(productReviewsTable)
      .where(eq(productReviewsTable.id, createdReview.id))
      .execute();
    expect(reviews).toHaveLength(0);
  });
});
