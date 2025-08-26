import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productReviewsTable } from '../db/schema';
import { type GetReviewByIdInput, type CreateProductReviewInput } from '../schema';
import { getProductReviewById } from '../handlers/get_product_review_by_id';

// Test data for creating reviews
const testReviewData: Omit<CreateProductReviewInput, 'image_urls' | 'is_published'> & { 
  image_urls: string[]; 
  is_published: boolean; 
} = {
  product_name: 'Logitech MX Master 3',
  brand: 'Logitech',
  category: 'mice',
  rating: 8.5,
  pros: ['Great ergonomics', 'Excellent battery life', 'Smooth scrolling'],
  cons: ['Expensive', 'Heavy weight'],
  review_text: 'This is an excellent productivity mouse with outstanding features for professional use.',
  image_urls: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
  is_published: true
};

const createTestReview = async (data = testReviewData) => {
  const result = await db.insert(productReviewsTable)
    .values({
      product_name: data.product_name,
      brand: data.brand,
      category: data.category,
      rating: data.rating, // Keep as number for real column type
      pros: data.pros,
      cons: data.cons,
      review_text: data.review_text,
      image_urls: data.image_urls,
      is_published: data.is_published
    })
    .returning()
    .execute();

  return result[0];
};

describe('getProductReviewById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return a product review by ID', async () => {
    // Create a test review
    const createdReview = await createTestReview();

    const input: GetReviewByIdInput = {
      id: createdReview.id
    };

    const result = await getProductReviewById(input);

    // Verify the review was found and all fields are correct
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdReview.id);
    expect(result!.product_name).toEqual('Logitech MX Master 3');
    expect(result!.brand).toEqual('Logitech');
    expect(result!.category).toEqual('mice');
    expect(result!.rating).toEqual(8.5);
    expect(typeof result!.rating).toBe('number'); // Verify numeric conversion
    expect(result!.pros).toEqual(['Great ergonomics', 'Excellent battery life', 'Smooth scrolling']);
    expect(result!.cons).toEqual(['Expensive', 'Heavy weight']);
    expect(result!.review_text).toEqual('This is an excellent productivity mouse with outstanding features for professional use.');
    expect(result!.image_urls).toEqual(['https://example.com/image1.jpg', 'https://example.com/image2.jpg']);
    expect(result!.is_published).toEqual(true);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeNull(); // Should be null initially
  });

  it('should return null when review ID does not exist', async () => {
    const input: GetReviewByIdInput = {
      id: 999999 // Non-existent ID
    };

    const result = await getProductReviewById(input);

    expect(result).toBeNull();
  });

  it('should handle unpublished reviews correctly', async () => {
    // Create an unpublished review
    const unpublishedData = {
      ...testReviewData,
      is_published: false
    };
    const createdReview = await createTestReview(unpublishedData);

    const input: GetReviewByIdInput = {
      id: createdReview.id
    };

    const result = await getProductReviewById(input);

    // Verify unpublished review can still be fetched
    expect(result).not.toBeNull();
    expect(result!.is_published).toEqual(false);
    expect(result!.product_name).toEqual('Logitech MX Master 3');
  });

  it('should handle reviews with empty arrays correctly', async () => {
    // Create review with minimal data
    const minimalData = {
      ...testReviewData,
      pros: [],
      cons: [],
      image_urls: []
    };
    const createdReview = await createTestReview(minimalData);

    const input: GetReviewByIdInput = {
      id: createdReview.id
    };

    const result = await getProductReviewById(input);

    // Verify empty arrays are handled correctly
    expect(result).not.toBeNull();
    expect(result!.pros).toEqual([]);
    expect(result!.cons).toEqual([]);
    expect(result!.image_urls).toEqual([]);
  });

  it('should handle different product categories correctly', async () => {
    // Create reviews for different categories
    const keyboardReview = {
      ...testReviewData,
      product_name: 'Corsair K95 RGB',
      brand: 'Corsair',
      category: 'keyboards' as const
    };
    const createdReview = await createTestReview(keyboardReview);

    const input: GetReviewByIdInput = {
      id: createdReview.id
    };

    const result = await getProductReviewById(input);

    expect(result).not.toBeNull();
    expect(result!.category).toEqual('keyboards');
    expect(result!.product_name).toEqual('Corsair K95 RGB');
    expect(result!.brand).toEqual('Corsair');
  });
});
