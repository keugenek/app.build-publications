import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productReviewsTable } from '../db/schema';
import { type UpdateProductReviewInput, type CreateProductReviewInput } from '../schema';
import { updateProductReview } from '../handlers/update_product_review';
import { eq } from 'drizzle-orm';

// Helper function to create a test review
const createTestReview = async (): Promise<number> => {
  const testReview: CreateProductReviewInput = {
    product_name: 'Original Product',
    brand: 'Original Brand',
    category: 'mice',
    rating: 7,
    pros: ['Original pro 1', 'Original pro 2'],
    cons: ['Original con 1'],
    review_text: 'This is the original review text for testing updates.',
    image_urls: ['https://example.com/original.jpg'],
    is_published: false
  };

  const result = await db.insert(productReviewsTable)
    .values({
      ...testReview,
      pros: testReview.pros,
      cons: testReview.cons,
      image_urls: testReview.image_urls || []
    })
    .returning()
    .execute();

  return result[0].id;
};

describe('updateProductReview', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update a product review with all fields', async () => {
    const reviewId = await createTestReview();

    const updateInput: UpdateProductReviewInput = {
      id: reviewId,
      product_name: 'Updated Product Name',
      brand: 'Updated Brand',
      category: 'keyboards',
      rating: 9,
      pros: ['Updated pro 1', 'Updated pro 2', 'Updated pro 3'],
      cons: ['Updated con 1', 'Updated con 2'],
      review_text: 'This is the updated review text with more details about the product.',
      image_urls: ['https://example.com/updated1.jpg', 'https://example.com/updated2.jpg'],
      is_published: true
    };

    const result = await updateProductReview(updateInput);

    // Verify all fields are updated correctly
    expect(result.id).toEqual(reviewId);
    expect(result.product_name).toEqual('Updated Product Name');
    expect(result.brand).toEqual('Updated Brand');
    expect(result.category).toEqual('keyboards');
    expect(result.rating).toEqual(9);
    expect(result.pros).toEqual(['Updated pro 1', 'Updated pro 2', 'Updated pro 3']);
    expect(result.cons).toEqual(['Updated con 1', 'Updated con 2']);
    expect(result.review_text).toEqual('This is the updated review text with more details about the product.');
    expect(result.image_urls).toEqual(['https://example.com/updated1.jpg', 'https://example.com/updated2.jpg']);
    expect(result.is_published).toEqual(true);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update only specified fields', async () => {
    const reviewId = await createTestReview();

    const partialUpdate: UpdateProductReviewInput = {
      id: reviewId,
      product_name: 'Partially Updated Product',
      rating: 8.5,
      is_published: true
    };

    const result = await updateProductReview(partialUpdate);

    // Verify only specified fields are updated
    expect(result.product_name).toEqual('Partially Updated Product');
    expect(result.rating).toEqual(8.5);
    expect(result.is_published).toEqual(true);

    // Verify unchanged fields remain the same
    expect(result.brand).toEqual('Original Brand');
    expect(result.category).toEqual('mice');
    expect(result.pros).toEqual(['Original pro 1', 'Original pro 2']);
    expect(result.cons).toEqual(['Original con 1']);
    expect(result.review_text).toEqual('This is the original review text for testing updates.');
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save updated review to database', async () => {
    const reviewId = await createTestReview();

    const updateInput: UpdateProductReviewInput = {
      id: reviewId,
      product_name: 'Database Test Product',
      rating: 6.5,
      is_published: true
    };

    await updateProductReview(updateInput);

    // Query database directly to verify changes were persisted
    const reviews = await db.select()
      .from(productReviewsTable)
      .where(eq(productReviewsTable.id, reviewId))
      .execute();

    expect(reviews).toHaveLength(1);
    const savedReview = reviews[0];
    expect(savedReview.product_name).toEqual('Database Test Product');
    expect(savedReview.rating).toEqual(6.5);
    expect(savedReview.is_published).toEqual(true);
    expect(savedReview.updated_at).toBeInstanceOf(Date);
  });

  it('should set updated_at timestamp when updating', async () => {
    const reviewId = await createTestReview();

    // Get original review to compare timestamps
    const originalReview = await db.select()
      .from(productReviewsTable)
      .where(eq(productReviewsTable.id, reviewId))
      .execute();

    // Wait a small amount to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const updateInput: UpdateProductReviewInput = {
      id: reviewId,
      product_name: 'Timestamp Test Product'
    };

    const result = await updateProductReview(updateInput);

    // Verify updated_at is set and different from created_at
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at).not.toEqual(originalReview[0].updated_at); // Should be different from null
    expect(result.updated_at!.getTime()).toBeGreaterThan(result.created_at.getTime());
  });

  it('should handle array fields correctly', async () => {
    const reviewId = await createTestReview();

    const updateInput: UpdateProductReviewInput = {
      id: reviewId,
      pros: ['New pro 1', 'New pro 2', 'New pro 3', 'New pro 4'],
      cons: ['Single new con'],
      image_urls: []
    };

    const result = await updateProductReview(updateInput);

    // Verify arrays are updated correctly
    expect(result.pros).toHaveLength(4);
    expect(result.pros).toEqual(['New pro 1', 'New pro 2', 'New pro 3', 'New pro 4']);
    expect(result.cons).toHaveLength(1);
    expect(result.cons).toEqual(['Single new con']);
    expect(result.image_urls).toHaveLength(0);
    expect(result.image_urls).toEqual([]);
  });

  it('should throw error when review does not exist', async () => {
    const nonExistentId = 99999;

    const updateInput: UpdateProductReviewInput = {
      id: nonExistentId,
      product_name: 'This should fail'
    };

    expect(updateProductReview(updateInput)).rejects.toThrow(/not found/i);
  });

  it('should handle rating decimal values correctly', async () => {
    const reviewId = await createTestReview();

    const updateInput: UpdateProductReviewInput = {
      id: reviewId,
      rating: 7.25
    };

    const result = await updateProductReview(updateInput);

    // Verify decimal rating is stored and retrieved correctly
    expect(result.rating).toEqual(7.25);
    expect(typeof result.rating).toEqual('number');

    // Verify in database
    const dbReview = await db.select()
      .from(productReviewsTable)
      .where(eq(productReviewsTable.id, reviewId))
      .execute();

    expect(dbReview[0].rating).toEqual(7.25);
  });

  it('should handle category updates correctly', async () => {
    const reviewId = await createTestReview();

    const updateInput: UpdateProductReviewInput = {
      id: reviewId,
      category: 'headsets'
    };

    const result = await updateProductReview(updateInput);

    expect(result.category).toEqual('headsets');

    // Verify all other categories work as well
    const categories = ['mousepads', 'controllers'] as const;
    for (const category of categories) {
      const categoryUpdate: UpdateProductReviewInput = {
        id: reviewId,
        category: category
      };

      const categoryResult = await updateProductReview(categoryUpdate);
      expect(categoryResult.category).toEqual(category);
    }
  });
});
